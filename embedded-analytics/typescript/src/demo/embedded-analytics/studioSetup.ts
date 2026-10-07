import type { AgDataEngine, AgReportState, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createDataEngine, studioTheme } from 'ag-studio';
import seedrandom from 'seedrandom';

import { getHalvynData } from './data';
import { financialsState, priceState, segmentsState } from './state';

/**
 * Everything the Embedded Analytics demo needs from Studio, shared by the framework variants.
 *
 * Each viewport is a separate Studio instance showing one full-canvas widget - the "Embedding
 * Single Widgets" pattern - and all of them read from one data engine the host creates, which is
 * the point of the demo: the host owns the data.
 */

export const VIEWPORT_KEYS = ['price', 'financials', 'segments'] as const;
export type ViewportKey = (typeof VIEWPORT_KEYS)[number];

export function isViewportKey(value: string | null | undefined): value is ViewportKey {
    return value != null && (VIEWPORT_KEYS as readonly string[]).includes(value);
}

/** The opening state for each viewport, keyed the same way its widget is. */
export const VIEWPORT_STATES: Record<ViewportKey, AgReportState> = {
    price: priceState,
    financials: financialsState,
    segments: segmentsState,
};

/** The title each viewport's edit affordance announces. */
export const VIEWPORT_TITLES: Record<ViewportKey, string> = {
    price: 'Share Price',
    financials: 'Revenue & Earnings',
    segments: 'Revenue by Segment',
};

/*
 * Institutional navy/bronze aesthetic applied through the Studio theme so it covers chart series,
 * axes and widget typography. The brand accent is `accentColor` (there is no `chartAccentColor`);
 * series colours come from the palette params.
 */
const SERIF = "'IBM Plex Serif', Georgia, 'Times New Roman', serif";
const SANS = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const NAVY = '#1b2a4a';
const BRONZE = '#b08d57';
const SLATE = '#5a6b8c';

const INK = '#1c2532';
const PAPER = '#ffffff';
const RULE = '#e3e7ee';

const fullScreenTheme = studioTheme.withParams({
    accentColor: NAVY,
    fontFamily: SANS,
    foregroundColor: INK,
    studioMinWidth: 0,
    studioMinHeight: 0,
    backgroundColor: PAPER,
    textColor: INK,
    studioCanvasBackgroundColor: PAPER,
    studioWidgetBackgroundColor: PAPER,
    chartTextColor: INK,
    chartAxisLineColor: RULE,
    chartGridLineColor: RULE,
    studioWidgetTitleFontFamily: SERIF,
    studioWidgetTitleFontWeight: 600,
    studioWidgetTitleFontSize: 14,
    studioWidgetSubtitleFontFamily: SANS,
    studioWidgetSubtitleFontSize: 11,
    chartFontFamily: SANS,
    chartFontSize: 11,
    chartPaletteFills1Color: NAVY,
    chartPaletteFills2Color: BRONZE,
    chartPaletteFills3Color: SLATE,
    chartPaletteStrokes1Color: NAVY,
    chartPaletteStrokes2Color: BRONZE,
    chartPaletteStrokes3Color: SLATE,
});

const embeddedTheme = fullScreenTheme.withParams({
    studioWrapperSpacing: 0,
});

/**
 * Expanded for editing: one widget filling the canvas, with the edit panel available. Panels are
 * only re-enabled while a viewport is expanded.
 */
export const FULLSCREEN_PROPERTIES: AgStudioProperties = {
    mode: 'edit',
    panels: {
        edit: { right: ['edit'] },
    },
    layout: {
        type: 'standalone',
        minWidth: 0,
        pagePadding: 0,
        widgetPadding: 0,
    },
    theme: fullScreenTheme,
};

/** Embedded in the page: view mode, no panels, no chrome of Studio's own. */
export const EMBEDDED_PROPERTIES: AgStudioProperties = {
    ...FULLSCREEN_PROPERTIES,
    mode: 'view',
    panels: {
        ...FULLSCREEN_PROPERTIES.panels,
        view: { left: [], right: [] },
        edit: { left: [], right: [] },
    },
    theme: embeddedTheme,
};

/**
 * One engine for every viewport, so the dataset is built once. This is the host-owns-the-data
 * story the demo exists to show.
 */
export function createHalvynDataEngine(): AgDataEngine {
    return createDataEngine(getHalvynData((seed) => seedrandom(seed)));
}

export interface ViewportStudioOptions {
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
    /** Called after every state update, so a host can re-assert its own invariants. */
    onStateUpdated?: () => void;
}

/**
 * Properties for one embedded viewport, reading from the shared engine.
 *
 * Properties rather than an instance, so every variant hands them to its own framework package the
 * way the other two demos do. One engine backs all three viewports - that sharing is the point.
 */
export function viewportProperties(
    key: ViewportKey,
    dataEngine: AgDataEngine,
    { studioOverrides, onStateUpdated }: ViewportStudioOptions = {}
): AgStudioProperties {
    return {
        ...EMBEDDED_PROPERTIES,
        ...studioOverrides,
        data: dataEngine,
        initialState: VIEWPORT_STATES[key],
        onStateUpdated,
    };
}

/**
 * Properties for the expanded editor, which is its own Studio instance seeded from what the
 * embedded one is currently showing.
 *
 * A second instance rather than the embedded one relocated: the editor is a different surface with
 * different properties, and every framework here renders it through its own package. `state` is
 * the embedded instance's state, so the editor opens on exactly what the reader was looking at;
 * the host applies the editor's state back on Save and discards it on Cancel.
 */
export function expandedViewportProperties(
    key: ViewportKey,
    dataEngine: AgDataEngine,
    state: AgReportState,
    { studioOverrides, onStateUpdated }: ViewportStudioOptions = {}
): AgStudioProperties {
    return {
        ...FULLSCREEN_PROPERTIES,
        ...studioOverrides,
        data: dataEngine,
        // Selected up front, so the edit panel opens on the widget rather than empty.
        initialState: withViewportSelection(state, key, true),
        onStateUpdated,
    };
}

/**
 * The state with the viewport's single widget selected, or cleared. The widget id in each
 * one-widget page equals its ViewportKey, which is what lets the edit panel open on it.
 */
export function withViewportSelection(state: AgReportState, key: ViewportKey, selected: boolean): AgReportState {
    const selection = selected ? { type: 'widget' as const, id: key } : undefined;
    return { ...state, pages: state.pages.map((page, index) => (index === 0 ? { ...page, selection } : page)) };
}

/** Whether the viewport's own widget is already the selection, so re-asserting it is a no-op. */
export function hasViewportSelection(api: AgStudioApi, key: ViewportKey): boolean {
    const selection = api.getState().pages[0]?.selection;
    return selection?.type === 'widget' && selection.id === key;
}
