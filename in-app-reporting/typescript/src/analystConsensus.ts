import type { AgTypeScriptComponent, AgWidgetParams } from 'ag-studio';

import type { AnalystConsensusDef } from './shared';
import { loadAnalystConsensus } from './shared';

export class AnalystConsensus implements AgTypeScriptComponent<AgWidgetParams<AnalystConsensusDef>> {
    private eGui!: HTMLDivElement;
    private eRating!: HTMLSpanElement;
    private eCount!: HTMLSpanElement;
    private hasLoaded = false;
    private loadCount = 0;

    init(params: AgWidgetParams<AnalystConsensusDef>): Promise<void> {
        const eGui = document.createElement('div');
        eGui.classList.add('analyst-consensus');
        const eRating = document.createElement('span');
        eRating.classList.add('analyst-consensus-rating');
        const eCount = document.createElement('span');
        eCount.classList.add('analyst-consensus-count');
        eGui.append(eRating, eCount);
        this.eGui = eGui;
        this.eRating = eRating;
        this.eCount = eCount;
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
        if (!view) {
            return;
        }
        this.eRating.textContent = view.ratingLabel;
        this.eRating.dataset.rating = view.rating;
        this.eCount.textContent = view.countLabel;
    }

    getGui() {
        return this.eGui;
    }
}
