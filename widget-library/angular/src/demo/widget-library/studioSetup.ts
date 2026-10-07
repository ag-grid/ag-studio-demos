import type { AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createStudio, studioTheme } from 'ag-studio';

import { getPreconfiguredWidgetsData } from './data';
import type { PcwRegistry } from './library';
import { preconfiguredWidgetsState } from './state';

/**
 * Everything the Widget Library demo needs from Studio, shared by the framework variants. The
 * catalogue itself is in `library.ts`; only the `createWidgets` that backs it differs per variant.
 */

const INTER = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * Grafana's own light/dark tokens (packages/grafana-data/src/themes - createColors.ts +
 * palette.ts). The brand orange and Inter/palette are shared across both modes; only
 * background/text/border/chrome differ, mirroring Grafana's real light and dark themes rather than
 * forcing one regardless of which mode the host is in.
 */
const GRAFANA_ORANGE = '#FF9900';

const grafanaDarkColors = {
    backgroundColor: '#181b1f', // Grafana background.primary (panel/widget surface)
    foregroundColor: 'rgba(204, 204, 220, 0.8)', // Grafana text.primary base, as a blend colour
    textColor: '#c8c8dc', // Grafana text.primary, rgb(204, 204, 220)
    subtleTextColor: 'rgba(204, 204, 220, 0.65)', // Grafana text.secondary
    studioPanelContainerBackgroundColor: '#22252b', // Grafana background.secondary (panel chrome)
    gridHeaderBackgroundColor: '#22252b',
    borderColor: 'rgb(54, 57, 64)', // Grafana border.weak
    studioCanvasBackgroundColor: '#111217', // Grafana background.canvas - darker than the panels
    browserColorScheme: 'dark' as const, // native form controls render dark-appropriate
};

const grafanaLightColors = {
    backgroundColor: '#ffffff', // Grafana background.primary (panel/widget surface)
    foregroundColor: 'rgba(36, 41, 46, 0.8)', // Grafana text.primary base, as a blend colour
    textColor: '#24292e', // Grafana text.primary, rgb(36, 41, 46)
    subtleTextColor: 'rgba(36, 41, 46, 0.75)', // Grafana text.secondary
    studioPanelContainerBackgroundColor: '#f4f5f5', // Grafana background.secondary (panel chrome)
    gridHeaderBackgroundColor: '#f4f5f5',
    borderColor: 'rgb(229, 229, 230)', // Grafana border.weak
    studioCanvasBackgroundColor: '#fbfbfb', // Grafana background.canvas - slightly off the panels
    browserColorScheme: 'light' as const,
};

/**
 * Grafana's real UI is flat and dense (its own default radius is 2px; ours is 0 - either way,
 * square), so there are no border-radius, shadow or padding overrides here.
 *
 * Colours are declared against Studio's built-in `light` and `dark-blue` modes, so a host that
 * drives `data-ag-theme-mode` switches modes natively with no runtime theme swapping. Typography,
 * accent and the series palette are mode-independent, so they sit in the base params.
 */
export const grafanaTheme = studioTheme
    .withParams({
        studioPanelWidth: 250, // sized so a full row of widget cards fits without blank space

        fontFamily: INTER,
        fontSize: 12,
        studioPanelHeaderFontFamily: INTER,
        studioCanvasFontFamily: INTER,
        studioWidgetTitleFontFamily: INTER,
        studioWidgetTitleFontSize: 17,
        studioWidgetTitleFontWeight: 700, // bolder, headline-style widget titles
        studioWidgetSubtitleFontFamily: INTER,
        studioWidgetCaptionFontFamily: INTER,
        chartFontFamily: INTER,
        chartFontSize: 11,

        accentColor: GRAFANA_ORANGE,
        studioWidgetResizeBorderColor: GRAFANA_ORANGE, // orange highlight border on the selected widget
        // Transparent widget surface with the default widget border on, so each panel reads as a
        // bordered outline over the canvas rather than a filled card.
        studioWidgetBackgroundColor: 'transparent',
        studioWidgetBorder: true,

        // Categorical series palette (Grafana classic).
        chartPaletteFills1Color: '#7EB26D',
        chartPaletteFills2Color: '#1F78C1',
        chartPaletteFills3Color: '#EAB839',
        chartPaletteFills4Color: '#E24D42',
        chartPaletteFills5Color: '#705DA0',
        chartPaletteFills6Color: '#6ED0E0',
        chartPaletteFills7Color: '#EF843C',
        chartPaletteStrokes1Color: '#7EB26D',
        chartPaletteStrokes2Color: '#1F78C1',
        chartPaletteStrokes3Color: '#EAB839',
        chartPaletteStrokes4Color: '#E24D42',
        chartPaletteStrokes5Color: '#705DA0',
        chartPaletteStrokes6Color: '#6ED0E0',
        chartPaletteStrokes7Color: '#EF843C',
    })
    .withParams(grafanaLightColors, 'light')
    .withParams(grafanaDarkColors, 'dark-blue');

export interface WidgetLibraryStudioOptions {
    /**
     * The widget catalogue, built by passing `widgetLibraryParams` through the `createWidgets` of
     * whichever framework package this variant uses.
     */
    widgets: AgStudioProperties<PcwRegistry>['widgets'];
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
}

/**
 * The demo's Studio properties: the curated catalogue, its dataset and its opening dashboard.
 *
 * Properties rather than an instance, because that is the part every framework variant shares. Each
 * of them hands these to its own framework package - `<AgStudio>` in React and Vue, `<ag-studio>`
 * in Angular - so the starter shows the integration a developer adopting Studio will actually
 * write. Only the plain-TypeScript variant creates the instance itself, through
 * `createWidgetLibraryStudio` below.
 */
export function widgetLibraryProperties({
    widgets,
    studioOverrides,
}: WidgetLibraryStudioOptions): AgStudioProperties<PcwRegistry> {
    return {
        ...studioOverrides,
        data: getPreconfiguredWidgetsData(),
        mode: 'edit',
        theme: grafanaTheme,
        // Turn on the widget border (off by default in page layout); the width and colour come
        // from the theme's studioWidgetBorder / borderColor.
        layout: { widgetBorderEnabled: true },
        initialState: preconfiguredWidgetsState,
        panels: {
            edit: { right: ['edit', 'filters'] },
            view: { right: ['filters'] },
        },
        widgets,
    };
}

/** Mount Studio on `canvas` directly. For the plain-TypeScript variant, which has no wrapper. */
export function createWidgetLibraryStudio(
    canvas: HTMLElement,
    options: WidgetLibraryStudioOptions
): AgStudioApi<PcwRegistry> {
    return createStudio<PcwRegistry>(canvas, widgetLibraryProperties(options));
}

const PANEL_BREAKPOINT = 1000;

/**
 * Open the widget library (edit panel) mid-compose on desktop, and collapse it on narrow
 * viewports. Filters stays collapsed to keep the focus on composing.
 *
 * Returns a teardown for the resize listener.
 */
export function followPanelBreakpoint(api: AgStudioApi<PcwRegistry>): () => void {
    let lastCollapsed: boolean | undefined;

    const update = () => {
        const shouldCollapse = window.innerWidth <= PANEL_BREAKPOINT;
        if (shouldCollapse === lastCollapsed) return;
        lastCollapsed = shouldCollapse;

        const state = api.getState();
        api.setState({
            ...state,
            panels: {
                edit: { collapsed: shouldCollapse },
                filters: { collapsed: true },
            },
        });
    };

    update();
    window.addEventListener('resize', update);

    return () => window.removeEventListener('resize', update);
}
