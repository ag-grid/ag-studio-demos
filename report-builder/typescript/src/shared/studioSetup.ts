import type { AgPanelsState, AgStudioApi, AgStudioProperties, AgStudioThemeParams } from 'ag-studio';
import { createStudio, enableStudioDevValidations, studioTheme } from 'ag-studio';
import seedrandom from 'seedrandom';

import { getMainDemoDataGenerated, mainDemoCalendar, mainDemoReports } from './data/mainDemoData';
import { reportBuilderState } from './state';

/**
 * Everything the Report Builder demo needs from Studio itself, shared by the framework variants.
 * Each variant builds its own chrome, but they must all open on the same dashboard.
 */

/** The demo opens with Studio's own panels stowed, so the dashboard itself is what you see first. */
const COLLAPSED_PANELS: AgPanelsState = {
    ai: { collapsed: true },
    filters: { collapsed: true },
    edit: { collapsed: true },
    data: { collapsed: true },
};

/** Stand-in customer brand, deliberately not AG Studio, so the demo reads as your own app. */
export const BRAND = { name: 'Acme', accent: 'SaaS' } as const;

/** The reports the sidebar lists, in display order. */
export const reportBuilderReports = mainDemoReports;

const INTER = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * Acme's own theme: Inter, compact semibold titles, 4px corners and a bright blue-led palette with
 * warm accents. Typography, shape and series palette are the same in both modes; only the surfaces
 * differ.
 */
const acmeParams: Partial<AgStudioThemeParams> = {
    fontFamily: INTER,
    fontSize: 13,
    studioPanelHeaderFontFamily: INTER,
    studioPanelHeaderFontSize: 13,
    studioPanelHeaderFontWeight: 500,
    gridFontFamily: INTER,
    gridFontSize: 13,
    gridHeaderFontFamily: INTER,
    gridHeaderFontSize: 13,
    gridHeaderFontWeight: 500,
    gridCellFontFamily: INTER,
    gridCellFontSize: 13,
    chartFontFamily: INTER,
    studioCanvasFontFamily: INTER,
    studioWidgetTitleFontFamily: INTER,
    studioWidgetTitleFontSize: 15,
    studioWidgetTitleFontWeight: 600,
    studioWidgetSubtitleFontFamily: INTER,
    studioWidgetSubtitleFontSize: 12,
    studioWidgetCaptionFontFamily: INTER,
    studioWidgetCaptionFontSize: 13,

    spacing: 9,
    borderRadius: 4,
    studioWidgetBorderRadius: 4,
    gridRowBorder: false,
    chartTooltipBorder: false,

    chartPaletteFills1Color: '#2D6FE0',
    chartPaletteFills2Color: '#19B5C9',
    chartPaletteFills3Color: '#FF8A3D',
    chartPaletteFills4Color: '#F2545B',
    chartPaletteFills5Color: '#8B6CF0',
    chartPaletteFills6Color: '#FFC145',
    // Lines and outlines match the fills; left unset, they take Studio's default palette instead.
    chartPaletteStrokes1Color: '#2D6FE0',
    chartPaletteStrokes2Color: '#19B5C9',
    chartPaletteStrokes3Color: '#FF8A3D',
    chartPaletteStrokes4Color: '#F2545B',
    chartPaletteStrokes5Color: '#8B6CF0',
    chartPaletteStrokes6Color: '#FFC145',
};

/** White widgets on a faint blue canvas, under navy text. */
const acmeLightColors: Partial<AgStudioThemeParams> = {
    accentColor: '#2D6FE0',
    backgroundColor: '#FFFFFF',
    foregroundColor: '#14254A',
    borderColor: '#DCE6F5',
    studioWrapperBackgroundColor: '#F2F6FD',
    studioCanvasBackgroundColor: '#F2F6FD',
    chartGridLineColor: '#EDF2FA',
    browserColorScheme: 'light',
};

/**
 * Dark surfaces from a navy scale, with a lighter blue accent. The wrapper matches the demo
 * chrome's dark sidebar.
 */
const acmeDarkColors: Partial<AgStudioThemeParams> = {
    accentColor: '#5B9BFF',
    backgroundColor: '#13213F',
    foregroundColor: '#E2E8F0',
    borderColor: '#23355C',
    studioWrapperBackgroundColor: '#0B1630',
    studioCanvasBackgroundColor: '#0B1630',
    chartGridLineColor: '#23355C',
    browserColorScheme: 'dark',
};

/** Colours follow whichever mode the host page sets through `data-ag-theme-mode`. */
export const acmeTheme = studioTheme
    .withParams({ ...acmeParams, ...acmeLightColors })
    .withParams(acmeLightColors, 'light')
    .withParams(acmeDarkColors, 'dark')
    .withParams(acmeDarkColors, 'dark-blue');

export interface ReportBuilderStudioOptions {
    /**
     * Report shown on first paint, overriding the one the demo's own state nominates. Studio reads
     * its initial state once, so passing a deep-linked report here rather than correcting the
     * selection afterwards is what avoids a visible flash.
     */
    initialReportId?: string;
    /** Turn on Studio's development-time validation messages. Off by default. */
    devValidations?: boolean;
    /** AI configuration handed straight to Studio. Omit to run with no AI panel backing. */
    ai?: AgStudioProperties['ai'];
    /** Merged over the demo's own Studio properties, last. For host-side experiments only. */
    studioOverrides?: Partial<AgStudioProperties>;
}

/**
 * The demo's Studio properties: its dataset, report state, theme and panel layout.
 *
 * Properties rather than an instance, because that is the part every framework variant shares. Each
 * of them hands these to its own framework package - `<AgStudio>` in React and Vue, `<ag-studio>`
 * in Angular - so the starter shows the integration a developer adopting Studio will actually
 * write. Only the plain-TypeScript variant creates the instance itself, through
 * `createReportBuilderStudio` below.
 */
export function reportBuilderProperties(options: ReportBuilderStudioOptions = {}): AgStudioProperties {
    const { initialReportId, devValidations, ai, studioOverrides } = options;

    // Must precede the first Studio instance; a no-op on every mount after the first.
    if (devValidations) {
        enableStudioDevValidations();
    }

    const data = getMainDemoDataGenerated((seed) => seedrandom(seed));

    return {
        data: { ...data, calendars: [mainDemoCalendar] },
        mode: 'edit',
        theme: acmeTheme,
        layout: { widgetBorderEnabled: true },
        initialState: {
            ...reportBuilderState,
            panels: COLLAPSED_PANELS,
            ...(initialReportId ? { selectedPageId: initialReportId } : {}),
        },
        ai,
        panels: {
            edit: {
                left: ['ai'],
                right: ['filters', 'edit', 'data'],
            },
            view: {
                right: ['filters'],
            },
        },
        ...studioOverrides,
    };
}

/** Mount Studio on `canvas` directly. For the plain-TypeScript variant, which has no wrapper. */
export function createReportBuilderStudio(canvas: HTMLElement, options: ReportBuilderStudioOptions = {}): AgStudioApi {
    return createStudio(canvas, reportBuilderProperties(options));
}

/** A blank report page, as both variants' New report button appends. */
export function createBlankReport(id: string) {
    return { id, widgets: {}, widgetLayout: {}, filter: {} };
}
