/**
 * Seeded, internally-consistent fictional dataset for the pre-configured widgets
 * demo (a single B2B SaaS tenant of ~500 seats). A fixed seed keeps the data stable
 * across reloads. All units are neutral counts / fractions — no currency.
 *
 * The model is team-grained so a Team slicer filters the whole dashboard: `teams`
 * carries each team's current snapshot, `usage` is a per-team monthly series, and
 * `adoption` is a per-team × feature matrix. Org-level KPIs are model expressions
 * that aggregate `teams` (so they recompute when a team is selected). `workflows`,
 * `retention` and `governance` are genuinely org-level and do not slice by team.
 *
 * Consistency invariants (asserted at the end):
 *   Σ teams.seatsPurchased = 500, Σ seatsAssigned = 470, Σ seatsActive = 340
 *   per team: seatsActive ≤ seatsAssigned ≤ seatsPurchased
 *   Σ teams.activeUsers = 340 (= MAU), Σ teams.dau = 140, Σ teams.pendingInvites = 7
 *   usage latest month per team = that team's activeUsers (so Σ latest month = MAU)
 *   per usage row: returningUsers = activeUsers - newUsers ≥ 0
 *   retention non-increasing across weekOffset within a cohort
 *   users.status derives from lastActive (Active <7d / At-risk 7-30d / Inactive >30d)
 *   exactly one governance flag is a Warning
 *
 * Percentages/ratios are stored as fractions in [0, 1] to pair with `percentageFormat`.
 */
import seedrandom from 'seedrandom';

const SEED = 'ag-studio-saas-usage-2026';

const END = new Date('2026-06-30T00:00:00Z');
const N_MONTHS = 16;

const PURCHASED = 500;
const ASSIGNED = 470;
const ACTIVE = 340; // == MAU == Σ teams.activeUsers
const DAU = 140;
const WAU = 235;
const PENDING_INVITES = 7;

type RNG = () => number;

function randInt(rng: RNG, lo: number, hi: number): number {
    return Math.floor(rng() * (hi - lo + 1)) + lo;
}
function randFloat(rng: RNG, lo: number, hi: number): number {
    return rng() * (hi - lo) + lo;
}
function clamp(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v;
}
function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}
function addDays(d: Date, days: number): Date {
    const out = new Date(d);
    out.setUTCDate(out.getUTCDate() + days);
    return out;
}

/** Distribute `total` across `weights.length` integer buckets summing to `total`. */
function apportion(total: number, weights: number[]): number[] {
    const sum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => (w / sum) * total);
    const floored = raw.map((r) => Math.floor(r));
    let remainder = total - floored.reduce((a, b) => a + b, 0);
    const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; remainder > 0; ++k, --remainder) {
        floored[order[k % order.length].i] += 1;
    }
    return floored;
}

/** Nudge integer `values` so they sum to `target`, respecting per-element `caps`. */
function reconcile(values: number[], target: number, caps: number[]): void {
    let diff = target - values.reduce((a, b) => a + b, 0);
    for (let guard = 0; diff !== 0 && guard < 100000; ++guard) {
        for (let i = 0; i < values.length && diff !== 0; ++i) {
            if (diff > 0 && values[i] < caps[i]) {
                values[i] += 1;
                diff -= 1;
            } else if (diff < 0 && values[i] > 1) {
                values[i] -= 1;
                diff += 1;
            }
        }
    }
}

export interface TeamRow {
    name: string;
    headcount: number;
    seatsPurchased: number;
    seatsAssigned: number;
    seatsActive: number;
    seatsInactive: number;
    activeUsers: number;
    dau: number;
    wau: number;
    pendingInvites: number;
    actions: number;
    adoptionPct: number;
}
export interface UsageRow {
    team: string;
    month: string;
    activeUsers: number;
    sessions: number;
    actionsCount: number;
    newUsers: number;
    returningUsers: number;
}
export interface AdoptionRow {
    team: string;
    feature: string;
    category: string;
    adoptionPct: number;
}
export interface UserRow {
    name: string;
    team: string;
    role: string;
    signupDate: string;
    lastActive: string;
    daysInactive: number;
    sessions30d: number;
    actions30d: number;
    status: string;
}
export interface WorkflowRow {
    name: string;
    count: number;
}
export interface RetentionRow {
    cohort: string;
    weekOffset: number;
    retainedPct: number;
}
export interface GovernanceRow {
    rule: string;
    status: string;
    detail: string;
}

export interface DemoData {
    teams: TeamRow[];
    usage: UsageRow[];
    adoption: AdoptionRow[];
    users: UserRow[];
    workflows: WorkflowRow[];
    retention: RetentionRow[];
    governance: GovernanceRow[];
}

const TEAM_NAMES = ['Engineering', 'Sales', 'Product', 'Support', 'Marketing', 'Operations', 'Finance', 'Design'];

const FEATURES: Array<{ name: string; category: string; base: number }> = [
    { name: 'Dashboards', category: 'Core', base: 0.9 },
    { name: 'Reports', category: 'Core', base: 0.82 },
    { name: 'Search', category: 'Core', base: 0.78 },
    { name: 'Comments', category: 'Collaboration', base: 0.64 },
    { name: 'Notifications', category: 'Collaboration', base: 0.71 },
    { name: 'Templates', category: 'Collaboration', base: 0.48 },
    { name: 'Automations', category: 'Platform', base: 0.4 },
    { name: 'Integrations', category: 'Platform', base: 0.33 },
    { name: 'API Access', category: 'Platform', base: 0.22 },
    { name: 'Mobile App', category: 'Access', base: 0.55 },
];

const WORKFLOWS = [
    'Onboarding',
    'Invoice Approval',
    'Ticket Triage',
    'Content Review',
    'Deploy Pipeline',
    'Lead Routing',
    'Expense Report',
    'Data Sync',
    'Incident Response',
    'Contract Signoff',
];

const FIRST_NAMES = [
    'Ava',
    'Liam',
    'Maya',
    'Noah',
    'Sofia',
    'Ethan',
    'Zara',
    'Owen',
    'Priya',
    'Leo',
    'Chloe',
    'Ravi',
    'Isla',
    'Marco',
    'Nina',
    'Omar',
    'Elena',
    'Jonas',
    'Amara',
    'Theo',
];
const LAST_NAMES = [
    'Bennett',
    'Cho',
    'Delgado',
    'Ferreira',
    'Gupta',
    'Hansen',
    'Ito',
    'Kane',
    'Larsen',
    'Mensah',
    'Novak',
    'Oduya',
    'Patel',
    'Quinn',
    'Reyes',
    'Silva',
    'Tan',
    'Ueno',
    'Vargas',
    'Weber',
];
const ROLES = ['Admin', 'Member', 'Viewer'];

function statusFromDaysInactive(days: number): string {
    if (days < 7) return 'Active';
    if (days <= 30) return 'At-risk';
    return 'Inactive';
}

export function generateDemoData(): DemoData {
    const rng: RNG = seedrandom(SEED);

    // ── teams (the hub dimension + current snapshot) ─────────────────────────
    const weights = TEAM_NAMES.map(() => randFloat(rng, 0.6, 1.6));
    const seatsPurchased = apportion(PURCHASED, weights);
    const seatsAssigned = seatsPurchased.map((p) => Math.min(p, Math.round(p * randFloat(rng, 0.9, 0.98))));
    reconcile(seatsAssigned, ASSIGNED, seatsPurchased);
    const seatsActive = seatsAssigned.map((a) => Math.min(a, Math.round(a * randFloat(rng, 0.6, 0.85))));
    reconcile(seatsActive, ACTIVE, seatsAssigned);
    const dauByTeam = apportion(DAU, seatsActive);
    const wauByTeam = seatsActive.map((a, i) => Math.max(dauByTeam[i], Math.round(a * 0.69)));
    reconcile(wauByTeam, WAU, seatsActive);
    const pendingByTeam = apportion(PENDING_INVITES, weights);

    const teams: TeamRow[] = TEAM_NAMES.map((name, i) => ({
        name,
        headcount: seatsAssigned[i] + randInt(rng, 1, 8),
        seatsPurchased: seatsPurchased[i],
        seatsAssigned: seatsAssigned[i],
        seatsActive: seatsActive[i],
        seatsInactive: seatsAssigned[i] - seatsActive[i],
        activeUsers: seatsActive[i],
        dau: dauByTeam[i],
        wau: wauByTeam[i],
        pendingInvites: pendingByTeam[i],
        actions: seatsActive[i] * randInt(rng, 90, 260),
        adoptionPct: randFloat(rng, 0.4, 0.95),
    }));

    // ── usage (team × month) ─────────────────────────────────────────────────
    const months: string[] = [];
    for (let m = 0; m < N_MONTHS; ++m) {
        months.push(
            new Date(Date.UTC(END.getUTCFullYear(), END.getUTCMonth() - (N_MONTHS - 1 - m), 1))
                .toISOString()
                .slice(0, 10)
        );
    }
    const usage: UsageRow[] = [];
    for (const team of teams) {
        for (let m = 0; m < N_MONTHS; ++m) {
            const last = m === N_MONTHS - 1;
            const trend = 0.8 + (m / (N_MONTHS - 1)) * 0.2;
            const activeUsers = last
                ? team.activeUsers // latest month ties back to the snapshot (so Σ = MAU)
                : Math.max(1, Math.round(team.activeUsers * trend * randFloat(rng, 0.94, 1.04)));
            const newUsers = Math.min(activeUsers, Math.round(activeUsers * randFloat(rng, 0.04, 0.12)));
            usage.push({
                team: team.name,
                month: months[m],
                activeUsers,
                newUsers,
                returningUsers: activeUsers - newUsers,
                sessions: Math.round(activeUsers * randFloat(rng, 20, 40)),
                actionsCount: Math.round(activeUsers * randFloat(rng, 300, 900)),
            });
        }
    }

    // ── adoption (team × feature) ────────────────────────────────────────────
    const adoption: AdoptionRow[] = [];
    for (const team of teams) {
        const teamOffset = (team.adoptionPct - 0.67) * 0.5;
        for (const f of FEATURES) {
            adoption.push({
                team: team.name,
                feature: f.name,
                category: f.category,
                adoptionPct: clamp(f.base + teamOffset + randFloat(rng, -0.08, 0.08), 0.05, 0.99),
            });
        }
    }

    // ── users (named sample) ─────────────────────────────────────────────────
    const users: UserRow[] = [];
    const N_USERS = 40;
    for (let i = 0; i < N_USERS; ++i) {
        const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]}`;
        const team = teams[randInt(rng, 0, teams.length - 1)].name;
        const roll = rng();
        const daysInactive =
            roll < 0.65 ? randInt(rng, 0, 6) : roll < 0.87 ? randInt(rng, 7, 30) : randInt(rng, 31, 90);
        const recency = clamp(1 - daysInactive / 90, 0.05, 1);
        users.push({
            name,
            team,
            role: ROLES[roll < 0.12 ? 0 : roll < 0.8 ? 1 : 2],
            signupDate: isoDate(addDays(END, -randInt(rng, 20, N_MONTHS * 30))),
            lastActive: isoDate(addDays(END, -daysInactive)),
            daysInactive,
            sessions30d: Math.round(recency * randFloat(rng, 8, 60)),
            actions30d: Math.round(recency * randFloat(rng, 60, 900)),
            status: statusFromDaysInactive(daysInactive),
        });
    }

    // ── workflows (org, long-tailed) ─────────────────────────────────────────
    const workflows: WorkflowRow[] = WORKFLOWS.map((name, i) => ({
        name,
        count: Math.round(3200 / (i + 1) + randInt(rng, -80, 80)),
    })).sort((a, b) => b.count - a.count);

    // ── retention (org, 6 monthly cohorts, non-increasing) ───────────────────
    const retention: RetentionRow[] = [];
    const N_COHORTS = 6;
    const N_WEEKS = 9;
    for (let c = 0; c < N_COHORTS; ++c) {
        const cohort = new Date(Date.UTC(END.getUTCFullYear(), END.getUTCMonth() - (N_COHORTS - c), 1))
            .toISOString()
            .slice(0, 7);
        const floor = 0.4 + (c / (N_COHORTS - 1)) * 0.15;
        let pct = 1;
        for (let w = 0; w < N_WEEKS; ++w) {
            if (w > 0) {
                const target = floor + (1 - floor) * Math.exp(-w / 3.2);
                pct = Math.min(pct, clamp(target + randFloat(rng, -0.02, 0), floor, 1));
            }
            retention.push({ cohort, weekOffset: w, retainedPct: pct });
        }
    }

    // ── governance (org, exactly one Warning) ────────────────────────────────
    const governance: GovernanceRow[] = [
        { rule: 'MFA coverage at or above 90%', status: 'Warning', detail: 'Current coverage 82% (target 90%)' },
        { rule: 'SSO enforced', status: 'Pass', detail: 'SSO required for all members' },
        { rule: 'External sharing restricted', status: 'Pass', detail: 'External sharing disabled by policy' },
        { rule: 'Inactive users under 10%', status: 'Pass', detail: 'Inactive users at 6%' },
        { rule: 'Admin count within policy', status: 'Pass', detail: '4 admins (policy max 6)' },
    ];

    const data = { teams, usage, adoption, users, workflows, retention, governance };
    assertConsistency(data);
    return data;
}

function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

function assertConsistency(d: DemoData): void {
    const assertTrue = (cond: boolean, msg: string) => {
        if (!cond) throw new Error(`preconfigured-widgets data inconsistency: ${msg}`);
    };
    assertTrue(sum(d.teams.map((t) => t.seatsPurchased)) === PURCHASED, 'Σ seatsPurchased == 500');
    assertTrue(sum(d.teams.map((t) => t.seatsAssigned)) === ASSIGNED, 'Σ seatsAssigned == 470');
    assertTrue(sum(d.teams.map((t) => t.seatsActive)) === ACTIVE, 'Σ seatsActive == 340');
    assertTrue(sum(d.teams.map((t) => t.activeUsers)) === ACTIVE, 'Σ activeUsers == MAU 340');
    assertTrue(sum(d.teams.map((t) => t.dau)) === DAU, 'Σ dau == 140');
    assertTrue(sum(d.teams.map((t) => t.pendingInvites)) === PENDING_INVITES, 'Σ pendingInvites == 7');
    assertTrue(
        d.teams.every((t) => t.seatsActive <= t.seatsAssigned && t.seatsAssigned <= t.seatsPurchased),
        'per team active ≤ assigned ≤ purchased'
    );
    const latestMonth = d.usage.reduce((mx, r) => (r.month > mx ? r.month : mx), '');
    assertTrue(
        sum(d.usage.filter((r) => r.month === latestMonth).map((r) => r.activeUsers)) === ACTIVE,
        'Σ latest-month usage.activeUsers == MAU 340'
    );
    assertTrue(
        d.usage.every((r) => r.returningUsers >= 0 && r.returningUsers === r.activeUsers - r.newUsers),
        'returningUsers = activeUsers - newUsers ≥ 0'
    );
    const byCohort = new Map<string, number[]>();
    for (const r of d.retention) {
        const arr = byCohort.get(r.cohort) ?? [];
        arr.push(r.retainedPct);
        byCohort.set(r.cohort, arr);
    }
    for (const [, arr] of byCohort) {
        for (let i = 1; i < arr.length; ++i) assertTrue(arr[i] <= arr[i - 1] + 1e-9, 'retention non-increasing');
    }
    assertTrue(d.governance.filter((g) => g.status === 'Warning').length === 1, 'exactly one governance Warning');
    assertTrue(
        d.users.every((u) => u.status === statusFromDaysInactive(u.daysInactive)),
        'user status derives from daysInactive'
    );
}
