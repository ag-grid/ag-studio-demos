import type {
    AgConditionDefinition,
    AgDataEngine,
    AgStudioApi,
    AgStudioProperties,
    AgTypeScriptComponent,
    AgWidgetsConfig,
} from 'ag-studio';
import { createStudio, createWidgets } from 'ag-studio';

import { AnalystConsensus } from './analystConsensus';
import type { CompanyView, PeerGroup, PeerGroupRegistry } from './shared';
import {
    ANALYST_CONSENSUS_WIDGET,
    DISCLAIMER,
    buildCompanyView,
    companyReportProperties,
    formatAsOf,
    printCompanyReport,
    showCompanyReport,
} from './shared';

export interface CompanyReportPopupParams {
    filter: AgConditionDefinition;
    group: PeerGroup;
    dataEngine: AgDataEngine;
    studioOverrides?: Partial<AgStudioProperties>;
}

const widgets = (widgetConfig: AgWidgetsConfig<PeerGroupRegistry>) =>
    createWidgets<PeerGroupRegistry>({
        additionalTypes: [{ ...ANALYST_CONSENSUS_WIDGET, comp: AnalystConsensus }],
        menu: [{ label: 'Custom', widgetIds: ['analystConsensus'] }, ...widgetConfig.menu],
    });

function el(tag: string, className?: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function button(className: string, text: string, onClick: () => void): HTMLButtonElement {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = className;
    node.textContent = text;
    node.addEventListener('click', onClick);
    return node;
}

/** The host's own heading for the report: who the company is and where its share price stands. */
function masthead({ name, logoUrl, tagline, lastClose, change, direction, range52w }: CompanyView): HTMLElement[] {
    const logo = document.createElement('img');
    logo.className = 'agd-ea-report-masthead-logo';
    logo.src = logoUrl;
    logo.alt = '';

    const identity = el('div', 'agd-ea-report-masthead-identity');
    identity.append(
        el('div', 'agd-ea-report-masthead-name', name),
        el('div', 'agd-ea-report-masthead-tagline', tagline)
    );

    const marker = el('span', 'agd-ea-range-marker');
    marker.style.left = `${Math.min(Math.max(range52w.position, 0), 1) * 100}%`;
    const track = el('div', 'agd-ea-range-track');
    track.appendChild(marker);
    const ends = el('div', 'agd-ea-range-ends');
    ends.append(el('span', undefined, range52w.low), el('span', undefined, range52w.high));
    const range = el('div', 'agd-ea-range');
    range.append(el('div', 'agd-ea-report-masthead-label', '52-Week Range'), track, ends);

    const changeEl = el('div', 'agd-ea-report-masthead-change', change);
    changeEl.dataset.direction = direction;
    const price = el('div', 'agd-ea-report-masthead-price');
    price.append(
        el('div', 'agd-ea-report-masthead-close', lastClose),
        changeEl,
        el('div', 'agd-ea-report-masthead-label', 'Last Close')
    );

    return [logo, identity, range, price];
}

/**
 * The popup a drill-through opens: an A4 landscape page, with the company report in a Studio of its
 * own between the host's masthead and footer, and the host's toolbar above it.
 */
export class CompanyReportPopup implements AgTypeScriptComponent<CompanyReportPopupParams> {
    private eGui!: HTMLDivElement;
    private eMasthead!: HTMLElement;
    private studioApi!: AgStudioApi<PeerGroupRegistry>;

    init(params: CompanyReportPopupParams): void {
        const { filter, dataEngine, studioOverrides } = params;
        const eGui = document.createElement('div');
        eGui.className = 'agd-ea-report';

        const modeButton = button('agd-ea-button', 'Edit Mode', () => {
            const mode = this.studioApi.getProperty('mode') === 'edit' ? 'view' : 'edit';
            this.studioApi.setProperty('mode', mode);
            modeButton.textContent = mode === 'edit' ? 'View Mode' : 'Edit Mode';
        });
        const printButton = button('agd-ea-button agd-ea-button-primary', 'Print', printCompanyReport);
        const toolbar = el('div', 'agd-ea-report-toolbar');
        toolbar.append(modeButton, printButton);

        const page = el('article', 'agd-ea-report-page');
        page.dataset.printRoot = '';
        this.eMasthead = el('header', 'agd-ea-report-masthead');
        const mount = el('div', 'agd-ea-report-mount');
        const footer = el('footer', 'agd-ea-report-footer');
        footer.append(el('span', undefined, DISCLAIMER), el('span', undefined, `Figures as of ${formatAsOf()}`));
        page.append(this.eMasthead, mount, footer);

        eGui.append(toolbar, page);
        this.eGui = eGui;
        this.renderMasthead(params);
        this.studioApi = createStudio<PeerGroupRegistry>(mount, {
            ...companyReportProperties(dataEngine, filter, { studioOverrides }),
            widgets,
        });
    }

    refresh(params: CompanyReportPopupParams): void {
        this.renderMasthead(params);
        showCompanyReport(this.studioApi, params.filter);
    }

    getGui(): HTMLElement {
        return this.eGui;
    }

    destroy(): void {
        this.studioApi.destroy();
    }

    private renderMasthead({ group, filter }: CompanyReportPopupParams): void {
        const view = buildCompanyView(group, String(filter.value));
        this.eMasthead.replaceChildren(...(view ? masthead(view) : []));
    }
}
