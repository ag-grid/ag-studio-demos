import { Component, signal } from '@angular/core';
import type { AgWidgetParams } from 'ag-studio';
import type { AgCustomComponent } from 'ag-studio-angular';

import type { BarGaugeDef, BarGaugeView } from './shared';
import { loadBarGauge } from './shared';

/** The Bar Gauge custom widget: one LED bar per category, lit by threshold. */
@Component({
    standalone: true,
    template: `<div
        class="agd-bar-gauge"
        [style.--agd-bar-gauge-amber-from]="view()?.amberFrom + '%'"
        [style.--agd-bar-gauge-green-from]="view()?.greenFrom + '%'"
    >
        @for (row of view()?.rows; track row.label) {
            <div class="agd-bar-gauge-row" [attr.data-level]="row.level">
                <div class="agd-bar-gauge-label">{{ row.label }}</div>
                <div class="agd-bar-gauge-track">
                    <div class="agd-bar-gauge-fill" [style.--agd-bar-gauge-fill]="row.fill + '%'"></div>
                </div>
                <div class="agd-bar-gauge-value">{{ row.value }}</div>
            </div>
        }
    </div>`,
})
export class BarGaugeComponent implements AgCustomComponent<AgWidgetParams<BarGaugeDef>> {
    protected readonly view = signal<BarGaugeView | undefined>(undefined);
    private hasLoaded = false;
    private loadCount = 0;

    agInit(params: AgWidgetParams<BarGaugeDef>): Promise<void> {
        return this.updateData(params);
    }

    refresh(params: AgWidgetParams<BarGaugeDef>): Promise<void> {
        return this.updateData(params);
    }

    private async updateData(params: AgWidgetParams<BarGaugeDef>): Promise<void> {
        const load = ++this.loadCount;
        const isCurrent = () => load === this.loadCount;
        const view = await loadBarGauge(params, this.hasLoaded, isCurrent);
        if (!isCurrent()) {
            return;
        }
        this.hasLoaded = view != null;
        this.view.set(view);
    }
}
