import type { AgDataTransaction } from 'ag-studio';
import seedrandom from 'seedrandom';

/**
 * A simulated fleet of services, standing in for a monitoring backend that reports every second.
 *
 * Every service runs in every region and environment, and each of those series drifts around its
 * own baseline: each value takes a small random step and is pulled back towards normal, so it
 * wanders plausibly rather than jumping. Every few minutes an incident raises latency and errors
 * for one service in one production region, then fades.
 *
 * The simulation keeps the tables the dashboard reads:
 *
 * - `traffic`: each series' requests, error rate and p95 latency in each second, for the last 5
 *   minutes. Every second adds a row per series and removes the oldest.
 * - `events`: a rolling log of deploys, alerts and slow requests, capped at 300 rows.
 * - `status`: each series' current readings, one row per series, updated in place every second.
 *
 * `advanceTo` returns the changes since the last call as transactions, ready to apply to Studio's
 * data engine. A fixed seed means every load starts from the same values; only the timestamps
 * follow the clock.
 */

const SEED = 'ag-studio-service-health';

/** How far back the simulation starts, so the event log opens with its full history. */
const HISTORY_MINUTES = 30;

/** How many seconds of history the `traffic` table holds, including the current second. */
const TRAFFIC_WINDOW_SECONDS = 300;

/** The most rows the `events` table holds; the oldest are removed as new ones arrive. */
const MAX_EVENTS = 300;

/** The error rate the services promise to stay under: 1%, or 99% of requests succeeding. */
export const SLO_ERROR_RATE = 0.01;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HISTORY_MS = HISTORY_MINUTES * MINUTE_MS;
const TRAFFIC_WINDOW_MS = TRAFFIC_WINDOW_SECONDS * SECOND_MS;

interface ServiceProfile {
    name: string;
    team: string;
    endpoint: string;
    requestsPerMinute: number;
    latencyP95Ms: number;
    errorRate: number;
    cpu: number;
}

export const SERVICES: readonly ServiceProfile[] = [
    {
        name: 'Checkout',
        team: 'Commerce',
        endpoint: 'POST /checkout',
        requestsPerMinute: 1800,
        latencyP95Ms: 340,
        errorRate: 0.004,
        cpu: 0.52,
    },
    {
        name: 'Payments',
        team: 'Commerce',
        endpoint: 'POST /payments',
        requestsPerMinute: 900,
        latencyP95Ms: 520,
        errorRate: 0.003,
        cpu: 0.46,
    },
    {
        name: 'Search',
        team: 'Discovery',
        endpoint: 'GET /search',
        requestsPerMinute: 4200,
        latencyP95Ms: 210,
        errorRate: 0.002,
        cpu: 0.64,
    },
    {
        name: 'Catalogue',
        team: 'Discovery',
        endpoint: 'GET /products',
        requestsPerMinute: 3000,
        latencyP95Ms: 160,
        errorRate: 0.001,
        cpu: 0.38,
    },
    {
        name: 'Auth',
        team: 'Platform',
        endpoint: 'POST /token',
        requestsPerMinute: 2400,
        latencyP95Ms: 95,
        errorRate: 0.002,
        cpu: 0.33,
    },
    {
        name: 'Notifications',
        team: 'Platform',
        endpoint: 'POST /notify',
        requestsPerMinute: 1200,
        latencyP95Ms: 260,
        errorRate: 0.005,
        cpu: 0.41,
    },
];

/** Each region's share of traffic, relative to EU West. */
export const REGIONS: readonly { name: string; traffic: number }[] = [
    { name: 'EU West', traffic: 1 },
    { name: 'US East', traffic: 1.3 },
    { name: 'US West', traffic: 0.8 },
    { name: 'Asia Pacific', traffic: 0.6 },
];

/** Staging carries a trickle of test traffic beside production. */
export const ENVIRONMENTS: readonly { name: string; traffic: number }[] = [
    { name: 'Production', traffic: 1 },
    { name: 'Staging', traffic: 0.04 },
];

export interface TrafficRow {
    /** The second and the series, as one number. */
    id: number;
    second: Date;
    environment: string;
    region: string;
    service: string;
    requests: number;
    /** The error rate at that second, in errors per minute: a series sees only a handful a minute. */
    errorsPerMinute: number;
    latencyP95Ms: number;
}

export type ServiceHealth = 'Healthy' | 'Degraded' | 'Critical';

export interface StatusRow {
    /** The series, so each series keeps one row. */
    id: number;
    environment: string;
    region: string;
    service: string;
    health: ServiceHealth;
    requests: number;
    /** `requests` as a rate per second, for charts that cannot divide it themselves. */
    requestsPerSecond: number;
    errors: number;
    errorRate: number;
    latencyP95Ms: number;
    cpu: number;
}

export type EventSeverity = 'Info' | 'Warning' | 'Critical';

export interface EventRow {
    id: number;
    time: Date;
    environment: string;
    region: string;
    service: string;
    severity: EventSeverity;
    message: string;
    /** How long the request took, for slow-request events only. */
    durationMs?: number;
}

type Rng = () => number;

const SERIES_COUNT = SERVICES.length * REGIONS.length * ENVIRONMENTS.length;

/**
 * A value that drifts around 1: each step moves it by a small random amount and pulls it back
 * towards 1, so it wanders without running away. `reversion` and `volatility` are per minute.
 */
class Drift {
    value = 1;

    constructor(
        private readonly reversion: number,
        private readonly volatility: number,
        private readonly floor: number
    ) {}

    step(rng: Rng, minutes: number): void {
        const { reversion, volatility, floor } = this;
        const pull = reversion * (1 - this.value) * minutes;
        const shock = volatility * Math.sqrt(minutes) * gaussian(rng);
        this.value = Math.max(floor, this.value + pull + shock);
    }
}

/** One service in one region and environment. */
class Series {
    readonly load = new Drift(0.5, 0.05, 0.5);
    readonly latency = new Drift(0.6, 0.06, 0.6);
    readonly errors = new Drift(0.8, 0.3, 0.1);
    readonly cpu = new Drift(0.5, 0.06, 0.3);

    constructor(
        readonly index: number,
        readonly service: ServiceProfile,
        readonly region: (typeof REGIONS)[number],
        readonly environment: (typeof ENVIRONMENTS)[number]
    ) {}

    step(rng: Rng, minutes: number): void {
        this.load.step(rng, minutes);
        this.latency.step(rng, minutes);
        this.errors.step(rng, minutes);
        this.cpu.step(rng, minutes);
    }

    /** The series' readings, as rates per minute, with an incident's effect applied. */
    read(incident: IncidentEffect): Readings {
        const { service, region, environment, load, latency, errors, cpu } = this;
        const requests = Math.round(
            service.requestsPerMinute * region.traffic * environment.traffic * load.value * incident.traffic
        );
        return {
            requests,
            errors: Math.round(requests * service.errorRate * errors.value * incident.errors),
            latencyP95Ms: Math.round(service.latencyP95Ms * latency.value * incident.latency),
            cpu: Math.min(0.99, service.cpu * cpu.value * (0.6 + 0.4 * load.value) + incident.cpu),
        };
    }

    /**
     * The readings for one second, as a monitoring backend reports them: rates taken from the
     * drifting series with a little per-second variation, so the charts move every second without
     * turning to noise.
     */
    toTrafficRow(rng: Rng, secondMs: number, { requests, errors, latencyP95Ms }: Readings): TrafficRow {
        const { index, service, region, environment } = this;
        return {
            id: (secondMs / SECOND_MS) * SERIES_COUNT + index,
            second: new Date(secondMs),
            environment: environment.name,
            region: region.name,
            service: service.name,
            requests: Math.max(0, Math.round((requests / 60) * (1 + 0.02 * gaussian(rng)))),
            errorsPerMinute: errors,
            latencyP95Ms: Math.round(latencyP95Ms * (1 + 0.02 * gaussian(rng))),
        };
    }

    toStatusRow({ requests, errors, latencyP95Ms, cpu }: Readings): StatusRow {
        const { index, service, region, environment } = this;
        const errorRate = requests > 0 ? errors / requests : 0;
        let health: ServiceHealth = 'Healthy';
        if (errorRate > SLO_ERROR_RATE) {
            health = 'Critical';
        } else if (latencyP95Ms > service.latencyP95Ms * 1.5) {
            health = 'Degraded';
        }
        return {
            id: index,
            environment: environment.name,
            region: region.name,
            service: service.name,
            health,
            requests,
            requestsPerSecond: Math.round((requests / 60) * 10) / 10,
            errors,
            errorRate,
            latencyP95Ms,
            cpu,
        };
    }
}

interface Readings {
    requests: number;
    errors: number;
    latencyP95Ms: number;
    cpu: number;
}

interface IncidentEffect {
    traffic: number;
    latency: number;
    errors: number;
    cpu: number;
}

const NO_INCIDENT: IncidentEffect = { traffic: 1, latency: 1, errors: 1, cpu: 0 };

interface Incident {
    service: ServiceProfile;
    region: string;
    startMs: number;
    durationMs: number;
    latencyPeak: number;
    errorPeak: number;
    escalated: boolean;
}

/** The rows a batch of steps added, updated and removed in one table. */
class TableChanges<TRow extends { id: number }> {
    private readonly added = new Map<number, TRow>();
    private readonly updated = new Map<number, TRow>();
    private readonly removed = new Set<number>();

    constructor(private readonly tableId: string) {}

    put(row: TRow, isNew: boolean): void {
        const { id } = row;
        if (isNew || this.added.has(id)) {
            this.added.set(id, row);
        } else {
            this.updated.set(id, row);
        }
    }

    remove(id: number): void {
        if (!this.added.delete(id)) {
            this.updated.delete(id);
            this.removed.add(id);
        }
    }

    toTransaction(): AgDataTransaction | undefined {
        const { tableId, added, updated, removed } = this;
        if (added.size === 0 && updated.size === 0 && removed.size === 0) {
            return undefined;
        }
        return {
            tableId,
            ...(removed.size > 0 && { remove: [...removed] }),
            ...(updated.size > 0 && { update: [...updated.values()] }),
            ...(added.size > 0 && { add: [...added.values()] }),
        };
    }
}

export class ServiceHealthSimulation {
    private readonly rng: Rng = seedrandom(SEED);
    private readonly series: Series[] = [];
    /** The rows the tables hold, by id, oldest first. */
    private readonly events = new Map<number, EventRow>();
    private readonly status = new Map<number, StatusRow>();
    private readonly traffic = new Map<number, TrafficRow>();
    private nextEventId = 1;
    /** The time the simulation has reached, in whole seconds. */
    private clock: number;
    private incident?: Incident;
    private nextIncidentMs: number;
    private releases = 40;

    constructor(now = Date.now()) {
        for (const environment of ENVIRONMENTS) {
            for (const region of REGIONS) {
                for (const service of SERVICES) {
                    this.series.push(new Series(this.series.length, service, region, environment));
                }
            }
        }

        this.clock = Math.floor((now - HISTORY_MS) / SECOND_MS) * SECOND_MS;
        this.nextIncidentMs = this.clock + this.between(1, 3) * MINUTE_MS;

        // Fill the history the same way live updates are made.
        this.advanceTo(now);
    }

    getEvents(): EventRow[] {
        return [...this.events.values()];
    }

    getStatus(): StatusRow[] {
        return [...this.status.values()];
    }

    getTraffic(): TrafficRow[] {
        return [...this.traffic.values()];
    }

    /**
     * Run the simulation forward to `now`, a second at a time, and return what changed as one
     * transaction per table. Returns no transactions if less than a second has passed. A gap longer
     * than the history, such as a laptop waking up, skips straight to the history's start.
     */
    advanceTo(now: number): AgDataTransaction[] {
        const events = new TableChanges<EventRow>('events');
        const status = new TableChanges<StatusRow>('status');
        const traffic = new TableChanges<TrafficRow>('traffic');
        // Seconds that would be trimmed again before this call returns are not written at all.
        const trafficFromMs = now - TRAFFIC_WINDOW_MS;

        this.clock = Math.max(this.clock, Math.floor((now - HISTORY_MS) / SECOND_MS) * SECOND_MS);
        if (this.clock + SECOND_MS > now) {
            return [];
        }

        while (this.clock + SECOND_MS <= now) {
            this.clock += SECOND_MS;
            this.step(events, this.clock > trafficFromMs ? traffic : undefined);
        }
        this.writeStatus(status);
        this.trim(events, traffic);

        return [events.toTransaction(), status.toTransaction(), traffic.toTransaction()].filter(
            (transaction): transaction is AgDataTransaction => transaction != null
        );
    }

    private step(events: TableChanges<EventRow>, traffic?: TableChanges<TrafficRow>): void {
        const { rng, series, clock } = this;
        const minutes = SECOND_MS / MINUTE_MS;

        this.updateIncident(events);

        for (const s of series) {
            s.step(rng, minutes);

            const effect = this.incidentEffect(s);
            if (traffic != null) {
                const row = s.toTrafficRow(rng, clock, s.read(effect));
                traffic.put(row, true);
                this.traffic.set(row.id, row);
            }

            // Slow requests are rare, and many times more likely in a series under an incident.
            const chance = (s.environment.name === 'Production' ? 0.004 : 0.002) * (1 + (effect.latency - 1) * 12);
            if (rng() < chance) {
                const durationMs = Math.round(s.service.latencyP95Ms * effect.latency * (1.5 + 2.5 * rng()));
                this.addEvent(events, s.service.name, s.region.name, s.environment.name, 'Warning', {
                    message: `Slow request: ${s.service.endpoint}`,
                    durationMs,
                });
            }
        }

        // A release goes out every couple of minutes, more often to staging.
        if (rng() < 1 / 120) {
            const service = SERVICES[Math.floor(rng() * SERVICES.length)];
            const region = REGIONS[Math.floor(rng() * REGIONS.length)];
            const environment = rng() < 0.6 ? 'Staging' : 'Production';
            this.releases += 1;
            this.addEvent(events, service.name, region.name, environment, 'Info', {
                message: `Deployed ${service.name.toLowerCase()} v2.${this.releases}.0`,
            });
        }
    }

    private updateIncident(events: TableChanges<EventRow>): void {
        const { clock, incident } = this;

        if (incident == null) {
            if (clock < this.nextIncidentMs) {
                return;
            }
            const service = SERVICES[Math.floor(this.rng() * SERVICES.length)];
            const region = REGIONS[Math.floor(this.rng() * REGIONS.length)].name;
            this.incident = {
                service,
                region,
                startMs: clock,
                durationMs: this.between(1.5, 3) * MINUTE_MS,
                latencyPeak: this.between(2.5, 4),
                errorPeak: this.between(8, 20),
                escalated: false,
            };
            this.addEvent(events, service.name, region, 'Production', 'Warning', {
                message: `Latency rising on ${service.name}`,
            });
            return;
        }

        const { service, region, startMs, durationMs } = incident;
        if (!incident.escalated && clock - startMs >= durationMs * 0.25) {
            incident.escalated = true;
            this.addEvent(events, service.name, region, 'Production', 'Critical', {
                message: `${service.name} error rate above SLO`,
            });
        }
        if (clock - startMs >= durationMs) {
            this.incident = undefined;
            this.nextIncidentMs = clock + this.between(2, 5) * MINUTE_MS;
            this.addEvent(events, service.name, region, 'Production', 'Info', {
                message: `${service.name} recovered`,
            });
        }
    }

    /** How much the current incident affects a series: none, unless it is the one under it. */
    private incidentEffect(s: Series): IncidentEffect {
        const { incident, clock } = this;
        if (
            incident == null ||
            s.environment.name !== 'Production' ||
            s.service !== incident.service ||
            s.region.name !== incident.region
        ) {
            return NO_INCIDENT;
        }

        // Ramps up over the first fifth, holds, then fades over the last two fifths.
        const progress = (clock - incident.startMs) / incident.durationMs;
        const intensity = Math.max(0, Math.min(1, progress / 0.2, (1 - progress) / 0.4));
        return {
            traffic: 1 - 0.15 * intensity,
            latency: 1 + (incident.latencyPeak - 1) * intensity,
            errors: 1 + (incident.errorPeak - 1) * intensity,
            cpu: 0.25 * intensity,
        };
    }

    private writeStatus(changes: TableChanges<StatusRow>): void {
        const { series, status } = this;
        for (const s of series) {
            const row = s.toStatusRow(s.read(this.incidentEffect(s)));
            changes.put(row, !status.has(row.id));
            status.set(row.id, row);
        }
    }

    private addEvent(
        changes: TableChanges<EventRow>,
        service: string,
        region: string,
        environment: string,
        severity: EventSeverity,
        details: Pick<EventRow, 'message' | 'durationMs'>
    ): void {
        const row: EventRow = {
            id: this.nextEventId++,
            time: new Date(this.clock),
            environment,
            region,
            service,
            severity,
            ...details,
        };
        changes.put(row, true);
        this.events.set(row.id, row);
    }

    /** Drop the seconds that have left the window, and the events over the cap. */
    private trim(eventChanges: TableChanges<EventRow>, trafficChanges: TableChanges<TrafficRow>): void {
        const { events, traffic } = this;
        const oldestSecondMs = this.clock - (TRAFFIC_WINDOW_SECONDS - 1) * SECOND_MS;
        for (const [id, row] of traffic) {
            if (row.second.getTime() >= oldestSecondMs) {
                break;
            }
            traffic.delete(id);
            trafficChanges.remove(id);
        }

        for (const id of events.keys()) {
            if (events.size <= MAX_EVENTS) {
                break;
            }
            events.delete(id);
            eventChanges.remove(id);
        }
    }

    /** A random number between `low` and `high`. */
    private between(low: number, high: number): number {
        return low + (high - low) * this.rng();
    }
}

/** A normally distributed random number, mean 0 and standard deviation 1 (Box-Muller). */
function gaussian(rng: Rng): number {
    const u = 1 - rng();
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
