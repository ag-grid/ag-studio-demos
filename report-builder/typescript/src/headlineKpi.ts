import type { AgTypeScriptComponent, AgWidgetParams } from 'ag-studio';

import type { HeadlineKpiDef } from './shared';
import { loadHeadlineKpi } from './shared';

function el(tag: 'div' | 'span', className: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    return node;
}

/** The Headline KPI custom widget: a measure for its latest period, its change, and its target. */
export class HeadlineKpi implements AgTypeScriptComponent<AgWidgetParams<HeadlineKpiDef>> {
    private readonly eGui = el('div', 'agd-kpi');
    private readonly eValue = el('div', 'agd-kpi-value');
    private readonly eChange = el('div', 'agd-kpi-change');
    private readonly eChangeLabel = el('span', 'agd-kpi-change-label');
    private readonly eComparison = el('span', 'agd-kpi-comparison');
    private readonly eTarget = el('div', 'agd-kpi-target');
    private readonly eTargetFill = el('div', 'agd-kpi-target-fill');
    private readonly eTargetLabel = el('span', 'agd-kpi-target-label');
    private hasLoaded = false;
    private loadCount = 0;

    init(params: AgWidgetParams<HeadlineKpiDef>): Promise<void> {
        const track = el('div', 'agd-kpi-target-track');
        track.append(this.eTargetFill);
        this.eChange.append(this.eChangeLabel, this.eComparison);
        this.eTarget.append(track, this.eTargetLabel);
        this.eGui.append(this.eValue, this.eChange, this.eTarget);
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
        if (!view) {
            return;
        }
        const { value, change, target } = view;
        this.eValue.textContent = value;

        this.eChange.hidden = !change;
        if (change) {
            this.eChangeLabel.textContent = change.label;
            this.eChangeLabel.dataset.direction = change.direction;
            this.eChangeLabel.dataset.sentiment = change.sentiment;
            this.eComparison.textContent = change.comparison;
        }

        this.eTarget.hidden = !target;
        if (target) {
            this.eTargetFill.style.width = `${target.percent}%`;
            this.eTargetLabel.textContent = target.label;
        }
    }

    getGui() {
        return this.eGui;
    }
}
