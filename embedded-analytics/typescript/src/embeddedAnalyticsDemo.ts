import type { AgConditionDefinition, AgPopupInstance, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createStudio } from 'ag-studio';

import type { CompanyReportPopupParams } from './companyReportPopup';
import { CompanyReportPopup } from './companyReportPopup';
import { createOverviewPage } from './demoPage';
import type { DrillThroughHandler, ViewportKey } from './shared';
import {
    VIEWPORT_KEYS,
    buildOverviewView,
    companyReportPopupOptions,
    createPeerGroupDataEngine,
    getPeerGroup,
    viewportProperties,
} from './shared';

export interface EmbeddedAnalyticsDemoOptions {
    /** Element the demo renders into. Its page is removed again on destroy. */
    container: HTMLElement;
    /** Merged over the demo's own Studio properties. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
}

export interface EmbeddedAnalyticsDemo {
    /** The Studio instance behind each overview viewport, for hosts that drive them further. */
    readonly viewports: Readonly<Record<ViewportKey, AgStudioApi>>;
    /** Open the company report on the company `filter` selects. */
    openReport: (filter: AgConditionDefinition) => void;
    /** Close the company report, if one is open. */
    closeReport: () => void;
    destroy: () => void;
}

/**
 * Mount the In-App Reporting demo: a host application's own page with Studio widgets embedded in
 * it, from which the reader drills through to a full Studio report on any one company, opened in a
 * popup over the page.
 *
 * Every Studio instance reads from the one data engine created here - that shared engine is the
 * point.
 */
export function createEmbeddedAnalyticsDemo(options: EmbeddedAnalyticsDemoOptions): EmbeddedAnalyticsDemo {
    const { container, studioOverrides } = options;

    const group = getPeerGroup();
    const view = buildOverviewView(group);
    const dataEngine = createPeerGroupDataEngine(group);

    const root = document.createElement('div');
    root.className = 'agd-ea';
    container.appendChild(root);

    const overview = createOverviewPage(root, view);

    let popup: AgPopupInstance<CompanyReportPopupParams> | undefined;
    let popupParams: CompanyReportPopupParams | undefined;
    let restoreFocus: (() => void) | undefined;

    // While the report is open it is what the browser prints, rather than the page behind it.
    const setReportOpen = (open: boolean) => overview.sheet.toggleAttribute('data-print-root', !open);
    setReportOpen(false);

    const drillThrough: DrillThroughHandler = (filter, restoreFocusOnClose) => {
        // Focus goes back to wherever the latest drill-through came from.
        restoreFocus = restoreFocusOnClose;
        // The popup is not modal, so the overview can drill through again while it is open.
        if (popup && popupParams) {
            popupParams = { ...popupParams, filter };
            popup.refresh(popupParams);
            return;
        }

        popupParams = { filter, group, dataEngine, studioOverrides };
        // Any viewport can open it: they share the popup parent, so it opens over the whole demo.
        popup = viewports.companies.createPopup<CompanyReportPopupParams>({
            ...companyReportPopupOptions(root),
            comp: CompanyReportPopup,
            compParams: popupParams,
            closedCallback: () => {
                popup = undefined;
                popupParams = undefined;
                setReportOpen(false);
                restoreFocus?.();
            },
        });
        setReportOpen(true);
    };

    const viewports = {} as Record<ViewportKey, AgStudioApi>;
    for (const key of VIEWPORT_KEYS) {
        viewports[key] = createStudio(
            overview.mounts[key],
            viewportProperties(key, dataEngine, root, drillThrough, { studioOverrides })
        );
    }

    return {
        viewports,
        openReport: (filter) => drillThrough(filter),
        closeReport: () => popup?.closePopup(),
        destroy: () => {
            popup?.closePopup();
            for (const key of VIEWPORT_KEYS) {
                viewports[key].destroy();
            }
            root.remove();
        },
    };
}
