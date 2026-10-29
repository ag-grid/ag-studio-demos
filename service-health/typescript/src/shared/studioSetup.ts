import type { AgCreateWidgetsParams, AgStudioProperties, AgStudioThemeParams } from 'ag-studio';
import { studioTheme } from 'ag-studio';

import { getServiceHealthData } from './data';
import type { ServiceHealthRegistry } from './heatmapWidget';
import { heatmapWidget } from './heatmapWidget';
import type { ServiceHealthSimulation } from './simulation';
import { serviceHealthState } from './state';

const PLEX = "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * After IBM's Carbon design system: IBM Plex Sans, square corners, Gray neutrals and Carbon's
 * categorical data-viz palette. Typography, shape and series palette are the same in both modes;
 * only the surfaces, text and accent differ.
 */
const carbonParams: Partial<AgStudioThemeParams> = {
    fontFamily: PLEX,
    fontSize: 14,
    studioPanelHeaderFontFamily: PLEX,
    studioPanelHeaderFontSize: 14,
    studioPanelHeaderFontWeight: 600,
    gridFontFamily: PLEX,
    gridFontSize: 14,
    gridHeaderFontFamily: PLEX,
    gridHeaderFontSize: 14,
    gridHeaderFontWeight: 600,
    gridCellFontFamily: PLEX,
    gridCellFontSize: 14,
    chartFontFamily: PLEX,
    studioCanvasFontFamily: PLEX,
    studioWidgetTitleFontFamily: PLEX,
    studioWidgetTitleFontWeight: 600,
    studioWidgetSubtitleFontFamily: PLEX,
    studioWidgetCaptionFontFamily: PLEX,
    studioWidgetCaptionFontSize: 14,

    spacing: 8,
    borderRadius: 0,
    studioWidgetBorderRadius: 0,

    // The Carbon hues the heatmap's cool-to-hot scale passes through, alternating cool and warm so
    // neighbouring series stay apart. Red is left out: the dashboard keeps it for falling values.
    chartPaletteFills1Color: '#0F62FE',
    chartPaletteFills2Color: '#FF832B',
    chartPaletteFills3Color: '#33B1FF',
    chartPaletteFills4Color: '#F1C21B',
    chartPaletteFills5Color: '#009D9A',
    chartPaletteFills6Color: '#42BE65',
    // Outlines match the fills; left unset, series that draw one by default, such as the
    // histogram, take Studio's default palette instead.
    chartPaletteStrokes1Color: '#0F62FE',
    chartPaletteStrokes2Color: '#FF832B',
    chartPaletteStrokes3Color: '#33B1FF',
    chartPaletteStrokes4Color: '#F1C21B',
    chartPaletteStrokes5Color: '#009D9A',
    chartPaletteStrokes6Color: '#42BE65',
};

/** Carbon's Gray 100 theme, with Blue 50 as the interactive colour. */
const carbonDarkColors: Partial<AgStudioThemeParams> = {
    accentColor: '#4589FF',
    backgroundColor: '#262626',
    foregroundColor: '#F4F4F4',
    borderColor: '#393939',
    studioCanvasBackgroundColor: '#161616',
    studioCanvasGridLineColor: '#393939',
    chartAxisLineColor: '#525252',
    // Carbon's Gray 100 support colours, and its highlight token behind a changed value.
    valueChangeUpColor: '#42BE65',
    valueChangeDownColor: '#FA4D56',
    valueChangeHighlightBackgroundColor: '#002D9C',
    browserColorScheme: 'dark',
};

/** Carbon's White theme on a Gray 10 canvas, with Blue 60 as the interactive colour. */
const carbonLightColors: Partial<AgStudioThemeParams> = {
    accentColor: '#0F62FE',
    backgroundColor: '#FFFFFF',
    foregroundColor: '#161616',
    borderColor: '#E0E0E0',
    studioCanvasBackgroundColor: '#F4F4F4',
    studioCanvasGridLineColor: '#E0E0E0',
    chartAxisLineColor: '#C6C6C6',
    // Carbon's White support colours, and its highlight token behind a changed value.
    valueChangeUpColor: '#24A148',
    valueChangeDownColor: '#DA1E28',
    valueChangeHighlightBackgroundColor: '#D0E2FF',
    browserColorScheme: 'light',
};

/**
 * Colours are declared against Studio's built-in `light` and `dark-blue` modes, so the demo follows
 * whichever mode the host page sets through `data-ag-theme-mode`, and is light where none is set.
 */
export const carbonTheme = studioTheme
    .withParams(carbonParams)
    .withParams(carbonLightColors, 'light')
    .withParams(carbonDarkColors, 'dark-blue');

/** What each variant passes to its own framework's `createWidgets`: the heatmap widget type. */
export const serviceHealthWidgets: AgCreateWidgetsParams<ServiceHealthRegistry> = {
    additionalTypes: [heatmapWidget],
};

export interface ServiceHealthStudioOptions {
    /** The simulation the live tables start from. Its later changes are sent by a `LiveFeed`. */
    simulation: ServiceHealthSimulation;
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties<ServiceHealthRegistry>>;
}

/**
 * The demo's Studio properties: the live dataset and the dashboard it opens on.
 *
 * Properties rather than an instance, because that is the part every framework variant shares: each
 * hands them to its own way of creating Studio, adding the `onStudioReady` that starts the feed.
 */
export function serviceHealthProperties({
    simulation,
    studioOverrides,
}: ServiceHealthStudioOptions): AgStudioProperties<ServiceHealthRegistry> {
    return {
        data: getServiceHealthData(simulation),
        mode: 'edit',
        theme: carbonTheme,
        initialState: serviceHealthState,
        panels: {
            edit: { right: ['filters', 'edit', 'data'] },
            view: { right: ['filters'] },
        },
        // The heatmap is the only widget outside Studio's own menu groups, so the section that
        // collects such widgets is named for it.
        localeText: { widgetPanelWidgetCategoryUncategorized: 'Custom' },
        ...studioOverrides,
    };
}
