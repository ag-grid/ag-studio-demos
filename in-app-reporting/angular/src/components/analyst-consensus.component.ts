import { Component, signal } from '@angular/core';
import type { AgWidgetParams } from 'ag-studio';
import type { AgCustomComponent } from 'ag-studio-angular';

import type { AnalystConsensusDef, AnalystConsensusView } from '../shared';
import { loadAnalystConsensus } from '../shared';

/** The Analyst Consensus custom widget: the rating the price targets imply, and how many analysts set them. */
@Component({
    standalone: true,
    template: `<div class="analyst-consensus">
        <span class="analyst-consensus-rating" [attr.data-rating]="view()?.rating">{{ view()?.ratingLabel }}</span>
        <span class="analyst-consensus-count">{{ view()?.countLabel }}</span>
    </div>`,
})
export class AnalystConsensusComponent implements AgCustomComponent<AgWidgetParams<AnalystConsensusDef>> {
    protected readonly view = signal<AnalystConsensusView | undefined>(undefined);
    private hasLoaded = false;
    private loadCount = 0;

    agInit(params: AgWidgetParams<AnalystConsensusDef>): Promise<void> {
        return this.updateData(params);
    }

    refresh(params: AgWidgetParams<AnalystConsensusDef>): Promise<void> {
        return this.updateData(params);
    }

    private async updateData(params: AgWidgetParams<AnalystConsensusDef>): Promise<void> {
        const load = ++this.loadCount;
        const isCurrent = () => load === this.loadCount;
        const view = await loadAnalystConsensus(params, this.hasLoaded, isCurrent);
        if (!isCurrent()) {
            return;
        }
        this.hasLoaded = view != null;
        this.view.set(view);
    }
}
