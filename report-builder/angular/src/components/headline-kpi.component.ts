import { Component, signal } from '@angular/core';
import type { AgWidgetParams } from 'ag-studio';
import type { AgCustomComponent } from 'ag-studio-angular';

import type { HeadlineKpiDef, HeadlineKpiView } from '../shared';
import { loadHeadlineKpi } from '../shared';

/** The Headline KPI custom widget: a measure for its latest period, its change, and its target. */
@Component({
    standalone: true,
    template: `<div class="agd-kpi">
        <div class="agd-kpi-value">{{ view()?.value }}</div>
        @if (view()?.change; as change) {
            <div class="agd-kpi-change">
                <span
                    class="agd-kpi-change-label"
                    [attr.data-direction]="change.direction"
                    [attr.data-sentiment]="change.sentiment"
                    >{{ change.label }}</span
                >
                <span class="agd-kpi-comparison">{{ change.comparison }}</span>
            </div>
        }
        @if (view()?.target; as target) {
            <div class="agd-kpi-target">
                <div class="agd-kpi-target-track">
                    <div class="agd-kpi-target-fill" [style.width.%]="target.percent"></div>
                </div>
                <span class="agd-kpi-target-label">{{ target.label }}</span>
            </div>
        }
    </div>`,
})
export class HeadlineKpiComponent implements AgCustomComponent<AgWidgetParams<HeadlineKpiDef>> {
    protected readonly view = signal<HeadlineKpiView | undefined>(undefined);
    private hasLoaded = false;
    private loadCount = 0;

    agInit(params: AgWidgetParams<HeadlineKpiDef>): Promise<void> {
        return this.updateData(params);
    }

    refresh(params: AgWidgetParams<HeadlineKpiDef>): Promise<void> {
        return this.updateData(params);
    }

    private async updateData(params: AgWidgetParams<HeadlineKpiDef>): Promise<void> {
        const load = ++this.loadCount;
        const isCurrent = () => load === this.loadCount;
        const view = await loadHeadlineKpi(params, this.hasLoaded, isCurrent);
        if (!isCurrent()) {
            return;
        }
        this.hasLoaded = view != null;
        this.view.set(view);
    }
}
