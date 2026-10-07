import type { ViewportKey } from '@demo/embedded-analytics';
import {
    VIEWPORT_KEYS,
    buildTearSheetView,
    createHalvynDataEngine,
    expandedViewportProperties,
    hasViewportSelection,
    onEscapeWhileExpanded,
    showToast,
    viewportProperties,
    withViewportSelection,
} from '@demo/embedded-analytics';
import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createStudio } from 'ag-studio';

import type { ExpandedOverlay } from './expandViewport';
import { openExpandedOverlay } from './expandViewport';
import type { ViewportChrome } from './tearSheet';
import { appendPeerComparison, createTearSheet, createViewportChrome } from './tearSheet';

export interface EmbeddedAnalyticsDemoOptions {
    /** Element the demo renders into. Its sheet is removed again on destroy. */
    container: HTMLElement;
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
    /** Expands this viewport on first paint, for a host that deep-links one. */
    initialExpanded?: ViewportKey;
    /** Called whenever a viewport is expanded or collapsed, with the viewport now expanded. */
    onExpandedChange?: (viewportKey?: ViewportKey) => void;
}

export interface EmbeddedAnalyticsDemo {
    /** The Studio instance behind each viewport, for hosts that drive them further. */
    readonly apis: Readonly<Record<ViewportKey, AgStudioApi>>;
    expand: (viewportKey: ViewportKey) => void;
    collapse: () => void;
    destroy: () => void;
}

/** Which column of the sheet each viewport sits in. */
const COLUMNS: Record<ViewportKey, 'centre' | 'right'> = {
    price: 'centre',
    financials: 'centre',
    segments: 'right',
};

/**
 * Mount the Embedded Analytics demo: Studio widgets embedded in someone else's application,
 * styled to match it, with the host owning both the data and the chrome.
 *
 * Three separate Studio instances read from one data engine created here - that shared engine is
 * the point. Each can be expanded for editing, which moves its canvas into an overlay in `<body>`
 * and swaps Studio's properties rather than remounting anything.
 */
export function createEmbeddedAnalyticsDemo(options: EmbeddedAnalyticsDemoOptions): EmbeddedAnalyticsDemo {
    const { container, studioOverrides, initialExpanded, onExpandedChange } = options;

    const view = buildTearSheetView();
    const dataEngine = createHalvynDataEngine();
    const sheet = createTearSheet(container, view, () => window.print());

    const chrome = {} as Record<ViewportKey, ViewportChrome>;
    const apis = {} as Record<ViewportKey, AgStudioApi>;

    let overlay: ExpandedOverlay | undefined;
    /** The editor's own Studio instance, alive only while the overlay is open. */
    let editor: AgStudioApi | undefined;
    let stopEscapeListener: (() => void) | undefined;

    /** Close the editor, keeping its state only if asked. Cancel simply discards the instance. */
    const collapse = (keep: boolean) => {
        if (!overlay || !editor) return;
        const { key } = overlay;

        if (keep) {
            // Selection cleared on the way back: it was set for the editor's panel, and a card
            // with a selected widget would show a highlight nobody asked for.
            apis[key].setState(withViewportSelection(editor.getState(), key, false));
        }

        editor.destroy();
        overlay.close();
        stopEscapeListener?.();

        editor = undefined;
        overlay = undefined;
        stopEscapeListener = undefined;
        onExpandedChange?.(undefined);
    };

    const expand = (key: ViewportKey) => {
        if (overlay) {
            collapse(false);
        }

        overlay = openExpandedOverlay(key);
        overlay.saveButton.addEventListener('click', () => save());
        overlay.cancelButton.addEventListener('click', () => collapse(false));

        // A second instance, seeded from what the card is showing. The card's own instance is left
        // alone, which is what makes Cancel free: there is nothing to revert.
        editor = createStudio(
            overlay.slot,
            expandedViewportProperties(key, dataEngine, apis[key].getState(), {
                studioOverrides,
                // While the edit panel is open the widget must stay selected; re-assert it if a
                // stray click inside the canvas clears it. The guard makes this a no-op once
                // correct, so it never loops with its own setState.
                onStateUpdated: () => {
                    if (!editor || hasViewportSelection(editor, key)) return;
                    editor.setState(withViewportSelection(editor.getState(), key, true));
                },
            })
        );

        // Only while something is open: the listener suppresses Escape outright rather than
        // testing whether it has anything to cancel, so leaving it registered for the demo's
        // lifetime would take the key away from the host's own dialogs.
        stopEscapeListener = onEscapeWhileExpanded(() => collapse(false));
        onExpandedChange?.(key);
    };

    // Save applies the editor's state to the card and logs what a host would persist.
    const save = () => {
        if (overlay && editor) {
            // eslint-disable-next-line no-console
            console.log(`AG Studio - saved "${overlay.key}" widget state:`, editor.getState());
        }
        showToast('Widget saved. State logged to console');
        collapse(true);
    };

    for (const key of VIEWPORT_KEYS) {
        chrome[key] = createViewportChrome(key);
        const column = COLUMNS[key] === 'centre' ? sheet.centreColumn : sheet.rightColumn;
        column.appendChild(chrome[key].card);

        apis[key] = createStudio(chrome[key].mount, viewportProperties(key, dataEngine, { studioOverrides }));

        chrome[key].editButton.addEventListener('click', () => expand(key));
    }

    // The peer table sits below the right column's viewport.
    appendPeerComparison(sheet.rightColumn, view);

    if (initialExpanded) {
        expand(initialExpanded);
    }

    return {
        apis,
        expand,
        collapse: () => collapse(false),
        destroy: () => {
            collapse(false);
            stopEscapeListener?.();
            for (const key of VIEWPORT_KEYS) {
                apis[key]?.destroy();
            }
            sheet.root.remove();
        },
    };
}
