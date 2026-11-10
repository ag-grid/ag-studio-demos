import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import type { AgStudioProperties } from 'ag-studio';
import { AgStudio, createWidgets } from 'ag-studio-angular';

import type { ServiceHealthRegistry, UpdateInterval } from './shared';
import {
    LiveFeed,
    ServiceHealthSimulation,
    UPDATE_INTERVALS,
    serviceHealthProperties,
    serviceHealthWidgets,
} from './shared';

/**
 * The Real-time Dashboard demo: a monitoring dashboard over a simulated fleet of services, kept live
 * by applying the fleet's changes to Studio's data engine every second.
 *
 * The simulation, the feed and the dashboard are shared with the other framework variants; what
 * this one contributes is the toolbar that pauses and resumes the feed and sets how often it
 * updates.
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [AgStudio],
    template: `
        <div class="agd-sh">
            <div class="agd-sh-toolbar">
                <h1 class="agd-sh-title">Service Health</h1>
                <span class="agd-sh-status" [attr.data-running]="isRunning" role="status">
                    {{ isRunning ? 'Live' : 'Paused' }}
                </span>
                <button type="button" class="agd-sh-button" (click)="toggle()">
                    {{ isRunning ? 'Pause' : 'Resume' }}
                </button>
                <label class="agd-sh-control">
                    Update every
                    <select class="agd-sh-select" [value]="updateInterval" (change)="onIntervalChange($event)">
                        @for (ms of intervals; track ms) {
                            <option [value]="ms">{{ ms / 1000 }}s</option>
                        }
                    </select>
                </label>
            </div>
            <ag-studio class="agd-sh-canvas" [studioProperties]="studioProperties" />
        </div>
    `,
})
export class AppComponent implements OnDestroy {
    protected readonly intervals = UPDATE_INTERVALS;
    protected isRunning = false;
    protected updateInterval: UpdateInterval = UPDATE_INTERVALS[0];

    private readonly simulation = new ServiceHealthSimulation();
    private readonly feed = new LiveFeed({
        simulation: this.simulation,
        onChange: (changed) => {
            this.isRunning = changed.isRunning;
            this.updateInterval = changed.updateInterval;
        },
    });

    protected readonly studioProperties: AgStudioProperties<ServiceHealthRegistry> = {
        ...serviceHealthProperties({ simulation: this.simulation }),
        widgets: createWidgets(serviceHealthWidgets),
        onStudioReady: (event) => this.feed.connect(event.api.getDataEngine()),
    };

    protected toggle(): void {
        if (this.feed.isRunning) {
            this.feed.pause();
        } else {
            this.feed.start();
        }
    }

    protected onIntervalChange({ target }: Event): void {
        if (!(target instanceof HTMLSelectElement)) {
            return;
        }
        const selected = UPDATE_INTERVALS.find((ms) => String(ms) === target.value);
        if (selected != null) {
            this.feed.setUpdateInterval(selected);
        }
    }

    public ngOnDestroy(): void {
        this.feed.destroy();
    }
}
