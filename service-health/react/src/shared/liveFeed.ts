import type { AgDataEngine } from 'ag-studio';

import type { ServiceHealthSimulation } from './simulation';

/** The update intervals the demo offers, in milliseconds. */
export const UPDATE_INTERVALS = [1000, 2000, 5000] as const;

export type UpdateInterval = (typeof UPDATE_INTERVALS)[number];

export interface LiveFeedOptions {
    simulation: ServiceHealthSimulation;
    /** Called whenever the feed starts, pauses or changes interval, so controls can follow it. */
    onChange?: (feed: LiveFeed) => void;
}

/**
 * Pushes the simulation's changes into Studio on a timer, as a live source would.
 *
 * Each update runs the simulation up to the current time and applies what changed to every table
 * as one transaction, so no widget ever sees new traffic alongside a stale event log. A gap, from
 * pausing or from the tab being hidden, is caught up in the next update.
 *
 * Updates stop while the browser tab is hidden: nothing would be drawn, and widgets on a hidden
 * page hold their updates until it is shown again anyway.
 */
export class LiveFeed {
    private engine?: AgDataEngine;
    private timer?: ReturnType<typeof setInterval>;
    private running = false;
    private intervalMs: UpdateInterval = UPDATE_INTERVALS[0];

    constructor(private readonly options: LiveFeedOptions) {}

    get isRunning(): boolean {
        return this.running;
    }

    get updateInterval(): UpdateInterval {
        return this.intervalMs;
    }

    /** Start sending updates to Studio's data engine, which exists once Studio is ready. */
    connect(engine?: AgDataEngine): void {
        this.engine = engine;
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.start();
    }

    start(): void {
        this.running = true;
        this.schedule();
        this.options.onChange?.(this);
    }

    pause(): void {
        this.running = false;
        this.schedule();
        this.options.onChange?.(this);
    }

    setUpdateInterval(intervalMs: UpdateInterval): void {
        this.intervalMs = intervalMs;
        this.schedule();
        this.options.onChange?.(this);
    }

    destroy(): void {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
        clearInterval(this.timer);
        this.timer = undefined;
    }

    private readonly onVisibilityChange = () => this.schedule();

    /** Run the timer while the feed is running and the tab is visible, at the current interval. */
    private schedule(): void {
        clearInterval(this.timer);
        this.timer = undefined;

        if (!this.running || document.hidden) {
            return;
        }

        // Catch up at once, rather than leaving a gap until the first tick.
        this.update();
        this.timer = setInterval(() => this.update(), this.intervalMs);
    }

    private update(): void {
        const { engine, options } = this;
        if (engine?.applyTransaction == null) {
            return;
        }

        const transactions = options.simulation.advanceTo(Date.now());
        if (transactions.length > 0) {
            engine.applyTransaction(transactions).catch((error: unknown) => {
                console.error('Real-time Dashboard demo: could not apply an update', error);
            });
        }
    }
}
