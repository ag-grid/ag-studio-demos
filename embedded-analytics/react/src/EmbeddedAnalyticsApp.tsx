import type { ViewportKey } from '@demo/embedded-analytics';
import {
    buildTearSheetView,
    createHalvynDataEngine,
    lockBodyScroll,
    onEscapeWhileExpanded,
    showToast,
    withViewportSelection,
} from '@demo/embedded-analytics';
import type { AgReportState, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EmbeddedViewport } from './components/EmbeddedViewport';
import { TearSheet } from './components/TearSheet';

export interface EmbeddedAnalyticsAppProps {
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
    /**
     * Expands this viewport on first paint, for a host that deep-links one. Read once; use the
     * `onExpandedChange` callback to follow it afterwards.
     */
    initialExpanded?: ViewportKey;
    /** Called whenever a viewport is expanded or collapsed, with the viewport now expanded. */
    onExpandedChange?: (viewportKey?: ViewportKey) => void;
}

/**
 * The Embedded Analytics demo: Studio widgets embedded in someone else's application, styled to
 * match it, with the host owning both the data and the chrome.
 *
 * Three separate Studio instances read from one data engine this component creates - that shared
 * engine is the point. Each can be expanded in place for editing, which moves its wrapper to
 * `<body>` and swaps Studio's properties rather than remounting anything.
 */
export function EmbeddedAnalyticsApp({
    studioOverrides,
    initialExpanded,
    onExpandedChange,
}: EmbeddedAnalyticsAppProps) {
    const view = useMemo(buildTearSheetView, []);
    const dataEngine = useMemo(createHalvynDataEngine, []);

    /**
     * Which viewport is expanded. The component below follows this prop - it portals its own
     * chrome and its own editor instance - so the app only has to own the value.
     */
    const [expandedKey, setExpandedKey] = useState<ViewportKey | undefined>(undefined);
    // Read by `save`, whose identity must not change with it.
    const expandedKeyRef = useRef(expandedKey);
    expandedKeyRef.current = expandedKey;

    /** The card's Studio instance per viewport, registered as each one becomes ready. */
    const apis = useRef(new Map<ViewportKey, AgStudioApi>());

    const onExpandedChangeRef = useRef(onExpandedChange);
    onExpandedChangeRef.current = onExpandedChange;

    const collapse = useCallback(() => {
        setExpandedKey(undefined);
        onExpandedChangeRef.current?.(undefined);
    }, []);

    const expand = useCallback((key: ViewportKey) => {
        // The editor seeds itself from the card's state, so there has to be a card instance.
        if (!apis.current.has(key)) return;

        setExpandedKey(key);
        onExpandedChangeRef.current?.(key);
    }, []);

    /**
     * Save applies the editor's state to the card and logs what a host would persist. Cancel needs
     * no counterpart: the editor is a separate instance, so discarding it discards the edit.
     */
    const save = useCallback(
        (state: AgReportState) => {
            const key = expandedKeyRef.current;
            const api = key && apis.current.get(key);
            if (key && api) {
                // Selection cleared on the way back: it was set for the editor's panel, and a card
                // with a selected widget would show a highlight nobody asked for.
                api.setState(withViewportSelection(state, key, false));
                // eslint-disable-next-line no-console
                console.log(`AG Studio - saved "${key}" widget state:`, state);
            }
            showToast('Widget saved. State logged to console');
            collapse();
        },
        [collapse]
    );

    const cancel = collapse;

    const registerViewport = useCallback((key: ViewportKey, api?: AgStudioApi) => {
        if (api) {
            apis.current.set(key, api);
        } else {
            apis.current.delete(key);
        }
    }, []);

    // A deep-linked viewport starts expanded, but only once its card instance exists: the editor
    // seeds itself from that card's state, so expanding before it is ready has nothing to read.
    const deepLinked = useRef(false);
    useEffect(() => {
        if (deepLinked.current || !initialExpanded || !apis.current.has(initialExpanded)) return;
        deepLinked.current = true;
        expand(initialExpanded);
    }, [initialExpanded, expand]);

    useEffect(() => (expandedKey ? onEscapeWhileExpanded(cancel) : undefined), [expandedKey, cancel]);
    useEffect(() => (expandedKey ? lockBodyScroll() : undefined), [expandedKey]);

    const viewportProps = {
        dataEngine,
        studioOverrides,
        onReady: registerViewport,
        onExpand: expand,
        onSave: save,
        onCancel: cancel,
    };

    return (
        <div className="agd-ea" data-embedded-root>
            <TearSheet
                view={view}
                onExport={() => window.print()}
                centre={
                    <>
                        <EmbeddedViewport viewportKey="price" isExpanded={expandedKey === 'price'} {...viewportProps} />
                        <EmbeddedViewport
                            viewportKey="financials"
                            isExpanded={expandedKey === 'financials'}
                            {...viewportProps}
                        />
                    </>
                }
                right={
                    <EmbeddedViewport
                        viewportKey="segments"
                        isExpanded={expandedKey === 'segments'}
                        {...viewportProps}
                    />
                }
            />
        </div>
    );
}
