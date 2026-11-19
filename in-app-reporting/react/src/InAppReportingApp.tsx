import type { AgPopupInstance, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-react';
import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';

import type { CompanyReportPopupParams } from './components/CompanyReportPopup';
import { CompanyReportPopup } from './components/CompanyReportPopup';
import { OverviewPage } from './components/OverviewPage';
import type { DrillThroughHandler, ViewportKey } from './shared';
import {
    VIEWPORT_KEYS,
    buildOverviewView,
    companyReportPopupOptions,
    createPeerGroupDataEngine,
    getPeerGroup,
    viewportProperties,
} from './shared';

export interface InAppReportingAppProps {
    /** Merged over the demo's own Studio properties. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
}

/**
 * The In-App Reporting demo: a host application's own page with Studio widgets embedded in it,
 * from which the reader drills through to a full Studio report on any one company, opened in a
 * popup over the page.
 *
 * Every Studio instance reads from the one data engine this component creates - that shared engine
 * is the point.
 */
export function InAppReportingApp({ studioOverrides }: InAppReportingAppProps) {
    const group = useMemo(getPeerGroup, []);
    const view = useMemo(() => buildOverviewView(group), [group]);
    const dataEngine = useMemo(() => createPeerGroupDataEngine(group), [group]);

    // The viewports open their menus and the report popup in this element, so it must exist first.
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const opener = useRef<AgStudioApi>();
    const popup = useRef<{
        instance: AgPopupInstance<CompanyReportPopupParams>;
        params: CompanyReportPopupParams;
        /** Focus goes back to wherever the latest drill-through came from. */
        restoreFocusOnClose?: () => void;
    }>();

    const viewportPropertiesByKey = useMemo(() => {
        if (!root) return undefined;

        const drillThrough: DrillThroughHandler = (filter, restoreFocusOnClose) => {
            // The popup is not modal, so the overview can drill through again while it is open.
            const open = popup.current;
            if (open) {
                open.restoreFocusOnClose = restoreFocusOnClose;
                open.params = { ...open.params, filter };
                open.instance.refresh(open.params);
                return;
            }
            if (!opener.current) return;

            const params: CompanyReportPopupParams = { filter, group, dataEngine, studioOverrides };
            // Any viewport can open it: they share the popup parent, so it opens over the whole demo.
            const instance = opener.current.createPopup<CompanyReportPopupParams>({
                ...companyReportPopupOptions(root),
                comp: CompanyReportPopup,
                compParams: params,
                closedCallback: () => {
                    const restoreFocus = popup.current?.restoreFocusOnClose;
                    popup.current = undefined;
                    setReportOpen(false);
                    restoreFocus?.();
                },
            });
            popup.current = { instance, params, restoreFocusOnClose };
            setReportOpen(true);
        };

        return Object.fromEntries(
            VIEWPORT_KEYS.map((key): [ViewportKey, AgStudioProperties] => [
                key,
                {
                    ...viewportProperties(key, dataEngine, root, drillThrough, { studioOverrides }),
                    onApiReady: ({ api }) => {
                        opener.current ??= api;
                    },
                },
            ])
        ) as Record<ViewportKey, AgStudioProperties>;
    }, [root, group, dataEngine]);

    const viewports = Object.fromEntries(
        VIEWPORT_KEYS.map((key) => [
            key,
            viewportPropertiesByKey && (
                <AgStudio className="agd-ea-viewport-mount" studioProperties={viewportPropertiesByKey[key]} />
            ),
        ])
    ) as Record<ViewportKey, ReactNode>;

    return (
        <div className="agd-ea" ref={setRoot}>
            {/* While the report is open it is what the browser prints, rather than the page behind it. */}
            <OverviewPage view={view} viewports={viewports} isPrintRoot={!reportOpen} />
        </div>
    );
}
