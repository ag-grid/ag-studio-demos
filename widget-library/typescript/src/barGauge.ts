import type { AgTypeScriptComponent, AgWidgetParams } from 'ag-studio';

import type { BarGaugeDef } from './shared';
import { loadBarGauge } from './shared';

function el(className: string, text?: string): HTMLDivElement {
    const node = document.createElement('div');
    node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

/** The Bar Gauge custom widget: one LED bar per category, lit by threshold. */
export class BarGauge implements AgTypeScriptComponent<AgWidgetParams<BarGaugeDef>> {
    private readonly eGui = el('agd-bar-gauge');
    private hasLoaded = false;
    private loadCount = 0;

    init(params: AgWidgetParams<BarGaugeDef>): Promise<void> {
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
        if (!view) {
            return;
        }
        const { eGui } = this;
        eGui.style.setProperty('--agd-bar-gauge-amber-from', `${view.amberFrom}%`);
        eGui.style.setProperty('--agd-bar-gauge-green-from', `${view.greenFrom}%`);
        eGui.replaceChildren(
            ...view.rows.map(({ label, value, fill, level }) => {
                const row = el('agd-bar-gauge-row');
                row.dataset.level = level;
                const track = el('agd-bar-gauge-track');
                const fillEl = el('agd-bar-gauge-fill');
                fillEl.style.setProperty('--agd-bar-gauge-fill', `${fill}%`);
                track.append(fillEl);
                row.append(el('agd-bar-gauge-label', label), track, el('agd-bar-gauge-value', value));
                return row;
            })
        );
    }

    getGui() {
        return this.eGui;
    }
}
