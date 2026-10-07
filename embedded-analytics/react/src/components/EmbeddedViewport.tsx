import type { ViewportKey } from '@demo/embedded-analytics';
import {
    VIEWPORT_TITLES,
    expandedViewportProperties,
    hasViewportSelection,
    viewportProperties,
    withViewportSelection,
} from '@demo/embedded-analytics';
import type { AgDataEngine, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { AgStudio } from 'ag-studio-react';
import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
    viewportKey: ViewportKey;
    dataEngine: AgDataEngine;
    /** Whether this viewport is currently expanded for editing. */
    isExpanded: boolean;
    studioOverrides?: Partial<AgStudioProperties>;
    /** Receives the card's Studio instance when it is ready, and `undefined` on teardown. */
    onReady: (viewportKey: ViewportKey, api?: AgStudioApi) => void;
    onExpand: (viewportKey: ViewportKey) => void;
    /** Called with the editor's state, which the app applies to the card. */
    onSave: (state: ReturnType<AgStudioApi['getState']>) => void;
    onCancel: () => void;
}

/**
 * One embedded Studio instance, showing a single full-canvas widget, expandable for editing.
 *
 * Both instances are rendered by `ag-studio-react`. The editor is a **second** instance, seeded
 * from what the card is showing, rather than the card's instance relocated: it is a different
 * surface with different properties, and keeping them separate is what makes Cancel free - there
 * is nothing to revert, the editor is simply discarded.
 *
 * The editor is a React portal into `<body>` because the tear sheet is a scaled surface, which
 * traps a `position: fixed` overlay, and Studio's own popups attach to `<body>`. A portal keeps
 * the Save and Cancel buttons in the React tree, where their events still propagate.
 */
export function EmbeddedViewport({
    viewportKey,
    dataEngine,
    isExpanded,
    studioOverrides,
    onReady,
    onExpand,
    onSave,
    onCancel,
}: Props) {
    const cardApi = useRef<AgStudioApi>();
    const editorApi = useRef<AgStudioApi>();

    // Built once: these are the card's initial properties, and the engine never changes.
    const cardProperties = useMemo(
        (): AgStudioProperties => ({
            ...viewportProperties(viewportKey, dataEngine, { studioOverrides }),
            onApiReady: ({ api }) => {
                cardApi.current = api;
                onReady(viewportKey, api);
            },
            onStudioPreDestroyed: () => {
                cardApi.current = undefined;
                onReady(viewportKey, undefined);
            },
        }),
        [viewportKey, dataEngine]
    );

    // Rebuilt per expand, so the editor opens on whatever the card is showing at that moment.
    const editorProperties = (): AgStudioProperties => ({
        ...expandedViewportProperties(viewportKey, dataEngine, cardApi.current!.getState(), {
            studioOverrides,
            // While the edit panel is open the widget must stay selected; re-assert it if a stray
            // click inside the canvas clears it. The guard makes this a no-op once correct, so it
            // never loops with its own setState.
            onStateUpdated: () => {
                const api = editorApi.current;
                if (!api || hasViewportSelection(api, viewportKey)) return;
                api.setState(withViewportSelection(api.getState(), viewportKey, true));
            },
        }),
        onApiReady: ({ api }) => {
            editorApi.current = api;
        },
        onStudioPreDestroyed: () => {
            editorApi.current = undefined;
        },
    });

    const title = VIEWPORT_TITLES[viewportKey];

    return (
        <div className="agd-ea-viewport" data-viewport={viewportKey}>
            <AgStudio studioProperties={cardProperties} className="agd-ea-viewport-slot" />

            <button
                type="button"
                className="agd-ea-edit-button"
                onClick={() => onExpand(viewportKey)}
                title={`Edit ${title}`}
                aria-label={`Edit ${title}`}
            >
                <svg viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                    <path d="M2 26h28v2H2zM25.4 9c.8-.8.8-2 0-2.8l-3.6-3.6c-.8-.8-2-.8-2.8 0l-16 16V26h7.4l15-15zM20.4 4l3.6 3.6-3 3L17.4 7l3-3zM5 24v-4.6l11-11 3.6 3.6-11 11H5z" />
                </svg>
                <span>Edit</span>
            </button>

            {isExpanded &&
                createPortal(
                    <div className="agd-ea-viewport agd-ea-viewport-expanded" data-viewport={viewportKey}>
                        <div className="agd-ea-viewport-panel">
                            <div className="agd-ea-viewport-header">
                                <span className="agd-ea-viewport-header-title">Edit {title}</span>
                            </div>

                            <AgStudio studioProperties={editorProperties()} className="agd-ea-viewport-slot" />

                            <div className="agd-ea-viewport-footer">
                                <button type="button" className="button-secondary" onClick={onCancel}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="button"
                                    onClick={() => onSave(editorApi.current!.getState())}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
