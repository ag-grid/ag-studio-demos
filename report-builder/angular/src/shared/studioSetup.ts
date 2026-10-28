import type {
    AgDataSourcesDefinition,
    AgPanelsState,
    AgStudioApi,
    AgStudioProperties,
    AgStudioThemeParams,
} from 'ag-studio';
import { createStudio, enableStudioDevValidations, studioTheme } from 'ag-studio';
import seedrandom from 'seedrandom';

import { getMainDemoDataGenerated, mainDemoCalendar, mainDemoReports } from './data/mainDemoData';
import type { ReportBuilderRegistry } from './interfaces';
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
 * Acme's own theme: Inter, compact semibold titles, 4px corners and a muted navy palette, sober
 * enough to read as an enterprise BI tool. Typography, shape and series palette are the same in
 * both modes; only the surfaces differ.
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

    chartPaletteFills1Color: '#2F5D8C',
    chartPaletteFills2Color: '#5B9AA0',
    chartPaletteFills3Color: '#8B9DB5',
    chartPaletteFills4Color: '#C7953D',
    chartPaletteFills5Color: '#7C6BA0',
    chartPaletteFills6Color: '#B4574F',
};

/** Neutral light surfaces under near-black text. */
const acmeLightColors: Partial<AgStudioThemeParams> = {
    accentColor: '#2F5D8C',
    backgroundColor: '#FFFFFF',
    foregroundColor: '#1F2937',
    borderColor: '#E5E7EB',
    studioWrapperBackgroundColor: '#F5F6F8',
    studioCanvasBackgroundColor: '#F5F6F8',
    chartGridLineColor: '#F1F5F9',
    browserColorScheme: 'light',
};

/**
 * Dark surfaces from a slate scale, with a lighter navy accent. The wrapper matches the demo
 * chrome's dark sidebar.
 */
const acmeDarkColors: Partial<AgStudioThemeParams> = {
    accentColor: '#6C9BD2',
    backgroundColor: '#1E293B',
    foregroundColor: '#E2E8F0',
    borderColor: '#334155',
    studioWrapperBackgroundColor: '#0F172A',
    studioCanvasBackgroundColor: '#0F172A',
    chartGridLineColor: '#334155',
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
    studioOverrides?: Partial<AgStudioProperties<ReportBuilderRegistry>>;
}

/**
 * The demo's Studio properties: its dataset, report state, theme and panel layout.
 *
 * Properties rather than an instance, because that is the part every framework variant shares. Each
 * of them hands these to its own framework package - `<AgStudio>` in React and Vue, `<ag-studio>`
 * in Angular - so the starter shows the integration a developer adopting Studio will actually
 * write. Only the plain-TypeScript variant creates the instance itself, through
 * `createReportBuilderStudio` below.
 *
 * `widgets` adds the demo's Headline KPI to the built-in catalogue. Each variant builds it with its
 * own framework's `createWidgets`, since the widget's component is written in that framework.
 */
export function reportBuilderProperties(
    widgets: AgStudioProperties<ReportBuilderRegistry>['widgets'],
    options: ReportBuilderStudioOptions = {}
): AgStudioProperties<ReportBuilderRegistry> {
    const { initialReportId, devValidations, ai, studioOverrides } = options;

    // Must precede the first Studio instance; a no-op on every mount after the first.
    if (devValidations) {
        enableStudioDevValidations();
    }

    const data = getMainDemoDataGenerated((seed) => seedrandom(seed));

    return {
        // The dataset is declared against the default registry and uses only built-in formats, so it
        // holds for this one too; Studio's types compare registries whole and cannot see that.
        data: { ...data, calendars: [mainDemoCalendar] } as AgDataSourcesDefinition<ReportBuilderRegistry>,
        mode: 'edit',
        theme: acmeTheme,
        layout: { widgetBorderEnabled: true },
        widgets,
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
export function createReportBuilderStudio(
    canvas: HTMLElement,
    widgets: AgStudioProperties<ReportBuilderRegistry>['widgets'],
    options: ReportBuilderStudioOptions = {}
): AgStudioApi<ReportBuilderRegistry> {
    return createStudio<ReportBuilderRegistry>(canvas, reportBuilderProperties(widgets, options));
}

/** A blank report page, as both variants' New report button appends. */
export function createBlankReport(id: string) {
    return { id, widgets: {}, widgetLayout: {}, filter: {} };
}
