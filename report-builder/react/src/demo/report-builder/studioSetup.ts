import type { AgPanelsState, AgStudioApi, AgStudioProperties } from 'ag-studio';
import { createStudio, enableStudioDevValidations } from 'ag-studio';
import seedrandom from 'seedrandom';

import { getMainDemoDataGenerated, mainDemoCalendar, mainDemoReports } from '../data/mainDemoData';
import { mainDemoState } from '../data/mainDemoState';

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
 * The demo's Studio properties: its dataset, report state and panel layout.
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
        initialState: {
            ...mainDemoState,
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
