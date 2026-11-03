import type {
    AgBaseRegistry,
    AgConditionDefinition,
    AgContextMenuItem,
    AgDataEngine,
    AgFilterDefinition,
    AgGetContextMenuParams,
    AgLogicalDefinition,
    AgReportState,
    AgStudioApi,
    AgStudioProperties,
    AgWidgetsConfig,
} from 'ag-studio';
import { createDataEngine, studioTheme } from 'ag-studio';

import type { PeerGroup } from './data';
import { getPeerGroupData } from './data';
import type { PeerGroupRegistry } from './interfaces';
import { companiesState, companyReportState, marketCapState, revenueState, sharePriceState } from './state';

/**
 * Everything the In-App Reporting demo needs from Studio, shared by the framework variants.
 *
 * The overview is the host's own page with single-widget Studio viewports embedded in it - the
 * "Embedding Single Widgets" pattern. Drilling through from any of them opens a full Studio report
 * on the chosen company. Every instance reads from one data engine the host creates, which is the
 * point of the demo: the host owns the data.
 */

export const VIEWPORT_KEYS = ['companies', 'marketCap', 'sharePrice', 'revenue'] as const;
export type ViewportKey = (typeof VIEWPORT_KEYS)[number];

/** The opening state for each viewport, keyed the same way its widget is. */
const VIEWPORT_STATES: Record<ViewportKey, AgReportState> = {
    companies: companiesState,
    marketCap: marketCapState,
    sharePrice: sharePriceState,
    revenue: revenueState,
};

const NAVY = '#1b2a4a';
const BRONZE = '#b08d57';
const SLATE = '#5a6b8c';
const INK = '#1c2532';
const PAPER = '#ffffff';
const RULE = '#e3e7ee';

// Institutional navy/bronze applied through the Studio theme, so it covers chart series, axes and
// widget typography as well as Studio's own UI.
const reportTheme = studioTheme.withParams({
    accentColor: NAVY,
    backgroundColor: PAPER,
    foregroundColor: INK,
    browserColorScheme: 'light',
    studioCanvasBackgroundColor: PAPER,
    // The report's own widgets are set in Source Sans 3, so Studio's menus and popups match them.
    fontFamily: "'Source Sans 3', sans-serif",
    borderColor: RULE,
    studioWidgetTitleFontWeight: 600,
    studioWidgetTitleFontSize: 14,
    studioWidgetSubtitleFontSize: 11,
    studioPanelContainerBorderRadius: 0,
    studioCanvasMinWidth: 1000,
    chartPaletteFills1Color: NAVY,
    chartPaletteFills2Color: BRONZE,
    chartPaletteFills3Color: SLATE,
    chartPaletteFills4Color: '#d4b483',
    chartPaletteFills5Color: '#8fa3c4',
    chartPaletteFills6Color: '#6e5a3a',
    chartPaletteStrokes1Color: NAVY,
    chartPaletteStrokes2Color: BRONZE,
    chartPaletteStrokes3Color: SLATE,
    chartPaletteStrokes4Color: '#d4b483',
    chartPaletteStrokes5Color: '#8fa3c4',
    chartPaletteStrokes6Color: '#6e5a3a',
});

// No canvas minimums or wrapper spacing of Studio's own, so each widget fills exactly the box the
// host page gives it.
const embeddedTheme = reportTheme.withParams({
    studioCanvasMinWidth: 0,
    studioMinWidth: 0,
    studioMinHeight: 0,
    studioWrapperSpacing: 0,
    studioWidgetBackgroundColor: PAPER,
    chartTextColor: INK,
    chartAxisLineColor: RULE,
    chartGridLineColor: RULE,
    // The company report popup opens from a viewport and inherits this theme.
    dialogShadow: '0 24px 64px rgba(15, 23, 42, 0.28)',
});

/**
 * One engine for the whole demo, so the dataset is built once and every viewport and the report
 * read the same figures.
 */
export function createPeerGroupDataEngine(group: PeerGroup): AgDataEngine {
    return createDataEngine(getPeerGroupData(group));
}

export interface DemoStudioOptions {
    /** Merged over the demo's own Studio properties. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
}

/**
 * Called with the company the reader chose to drill through to, and with a callback that returns
 * focus to where they right-clicked, for whatever the host opens to call once it closes.
 */
export type DrillThroughHandler = (filter: AgConditionDefinition, restoreFocusOnClose?: () => void) => void;

/**
 * Drops the chart image download from every widget's toolbar, keeping CSV export: the image is a
 * fixed 600 by 300 PNG whatever the widget's size, so it adds little to a report embedded in a page.
 */
export function withoutImageDownload<TRegistry extends AgBaseRegistry>(
    config: AgWidgetsConfig<TRegistry>
): AgWidgetsConfig<TRegistry> {
    const widgets = config.widgets.map((widget) => ({
        ...widget,
        toolbar: widget.toolbar?.filter((item) => typeof item === 'string' || item.id !== 'download'),
    }));
    return { ...config, widgets };
}

/**
 * Properties for one overview viewport: view mode, no panels and no chrome of Studio's own, so the
 * widget reads as part of the host page. `popupParent` is the host element its context menu and
 * the company report popup open in, so neither is confined to the widget's own small box.
 */
export function viewportProperties(
    key: ViewportKey,
    dataEngine: AgDataEngine,
    popupParent: HTMLElement,
    onDrillThrough: DrillThroughHandler,
    { studioOverrides }: DemoStudioOptions = {}
): AgStudioProperties {
    return {
        mode: 'view',
        panels: {
            view: { left: [], right: [] },
            edit: { left: [], right: [] },
        },
        layout: {
            type: 'standalone',
            minWidth: 0,
            pagePadding: 0,
            widgetPadding: 0,
        },
        theme: embeddedTheme,
        widgets: withoutImageDownload,
        popupParent,
        getContextMenuItems: (params) => getDrillThroughMenuItems(params, onDrillThrough),
        ...studioOverrides,
        data: dataEngine,
        initialState: VIEWPORT_STATES[key],
    };
}

/**
 * Properties for the company report a drill-through opens, less `widgets`: each variant supplies
 * those itself, since the custom Analyst Consensus widget is a component of its own framework.
 */
export function companyReportProperties(
    dataEngine: AgDataEngine,
    filter: AgConditionDefinition,
    { studioOverrides }: DemoStudioOptions = {}
): Omit<AgStudioProperties<PeerGroupRegistry>, 'widgets'> {
    return {
        mode: 'view',
        panels: {
            edit: { right: ['filters', 'edit', 'data'] },
            view: { right: [] },
        },
        theme: reportTheme,
        ...studioOverrides,
        data: dataEngine,
        initialState: companyReportState,
        drillThrough: { filter },
    };
}

/** Room kept clear around the report popup when the demo is too small to show the whole page. */
const POPUP_INSET = 16;
/** The report page's printed width: A4 landscape at 96 DPI. */
const PAGE_PRINT_WIDTH = 1123;
/**
 * The report's A4 landscape page, plus the popup's 1px border, its 33px title bar and the 44px
 * toolbar above the page. The page fills whatever width the popup has, so a popup clamped to a
 * short window scrolls vertically only.
 */
const POPUP_WIDTH = PAGE_PRINT_WIDTH + 2;
const POPUP_HEIGHT = 794 + 44 + 33 + 2;

/** How the company report popup opens over `container`, the demo's popup parent. */
export function companyReportPopupOptions(container: HTMLElement) {
    const { width, height } = container.getBoundingClientRect();
    return {
        title: 'Company Report',
        movable: true,
        resizable: true,
        width: Math.max(Math.min(width - POPUP_INSET * 2, POPUP_WIDTH), 0),
        height: Math.max(Math.min(height - POPUP_INSET * 2, POPUP_HEIGHT), 0),
    };
}

/**
 * Print the open company report across the full A4 page. Studio sizes widgets in pixels from the width
 * on screen, and printing does not size them again, so a popup narrower than the page would print them
 * squeezed into its left part. So the page is pinned to its printed width, Studio is given two frames to
 * lay its widgets out again, and the pin comes off once printing ends.
 */
export function printCompanyReport(): void {
    const page = document.querySelector<HTMLElement>('.agd-ea-report-page');
    if (!page) {
        window.print();
        return;
    }
    page.style.width = `${PAGE_PRINT_WIDTH}px`;
    window.addEventListener('afterprint', () => page.style.removeProperty('width'), { once: true });
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

/** Point an open company report at another company, without remounting it. */
export function showCompanyReport(api: AgStudioApi<PeerGroupRegistry>, filter: AgConditionDefinition): void {
    // The filter goes first, so the report's widgets read the new company as they render.
    api.setProperty('drillThrough', { filter });
    api.setState(companyReportState);
}

function isLogicalDefinition(filter: AgFilterDefinition): filter is AgLogicalDefinition {
    return (filter as AgLogicalDefinition).conditions != null;
}

function getTickerCondition(filter: AgFilterDefinition): AgConditionDefinition | undefined {
    if (!isLogicalDefinition(filter)) {
        return filter.field.id === 'companies.ticker' ? filter : undefined;
    }
    for (const condition of filter.conditions) {
        const tickerCondition = getTickerCondition(condition);
        if (tickerCondition) {
            return tickerCondition;
        }
    }
    return undefined;
}

// The company report shows all of the company's data, so only the clicked ticker is passed on.
function getDrillThroughMenuItems(
    { filter, restoreFocusOnClose }: AgGetContextMenuParams,
    onDrillThrough: DrillThroughHandler
): AgContextMenuItem[] {
    const tickerCondition = filter == null ? undefined : getTickerCondition(filter);
    if (!tickerCondition) {
        return [];
    }
    return [
        {
            name: `Open ${tickerCondition.value} Report`,
            action: () => onDrillThrough(tickerCondition, restoreFocusOnClose),
        },
    ];
}
