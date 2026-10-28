import type {
    AgBaseRegistry,
    AgBaseWidgetDefinition,
    AgDefaultWidgetDefinition,
    AgWidgetDataFormat,
    AgWidgetFieldReference,
} from 'ag-studio';

export type HeadlineKpiChangeAs = 'percent' | 'points';

export interface HeadlineKpiStyle {
    /** The figure the latest period is measured against. Leave unset to hide the progress bar. */
    target?: number;
    /** Whether a rise is good news. Turn off for a measure such as a return rate. */
    higherIsBetter?: boolean;
    /**
     * Show the change as a percentage of the earlier period, or, for a measure that is itself a
     * rate, as the difference between the two in percentage points.
     */
    changeAs?: HeadlineKpiChangeAs;
}

export interface HeadlineKpiDef {
    type: 'headlineKpi';
    dataMapping: {
        value: AgWidgetFieldReference[];
        period: AgWidgetFieldReference[];
    };
    format?: AgWidgetDataFormat<HeadlineKpiStyle>;
}

export interface ReportBuilderRegistry extends AgBaseRegistry {
    widgets: readonly (AgDefaultWidgetDefinition | AgBaseWidgetDefinition<'headlineKpi', HeadlineKpiDef>)[];
}
