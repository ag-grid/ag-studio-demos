import type { AgBaseWidgetDefinition, AgWidgetFormParams, AgWidgetParams } from 'ag-studio';

import type { HeadlineKpiChangeAs, HeadlineKpiDef } from './interfaces';

/**
 * The Headline KPI custom widget, minus its component. Each framework variant renders it with a
 * component of its own, so only the definition and the figures it shows are shared.
 */

export type HeadlineKpiDirection = 'up' | 'down' | 'flat';
export type HeadlineKpiSentiment = 'positive' | 'negative' | 'neutral';

export interface HeadlineKpiChange {
    /** E.g. "+8.2%" or "-0.4 pts". */
    label: string;
    /** E.g. "vs 2024". */
    comparison: string;
    direction: HeadlineKpiDirection;
    sentiment: HeadlineKpiSentiment;
}

export interface HeadlineKpiTarget {
    /** The latest value as a share of the target, clamped to 0-100 for the bar's width. */
    percent: number;
    /** E.g. "84% of £15M target". */
    label: string;
}

export interface HeadlineKpiView {
    value: string;
    /** Absent when there is no earlier period to compare against. */
    change?: HeadlineKpiChange;
    /** Absent when no target is set. */
    target?: HeadlineKpiTarget;
}

/** A change smaller than this, as a fraction, reads as no change at all. */
const FLAT_THRESHOLD = 0.0005;

function getDirection(change: number): HeadlineKpiDirection {
    if (Math.abs(change) < FLAT_THRESHOLD) {
        return 'flat';
    }
    return change > 0 ? 'up' : 'down';
}

function getSentiment(direction: HeadlineKpiDirection, higherIsBetter: boolean): HeadlineKpiSentiment {
    if (direction === 'flat') {
        return 'neutral';
    }
    return (direction === 'up') === higherIsBetter ? 'positive' : 'negative';
}

function formatChange(change: number, changeAs: HeadlineKpiChangeAs): string {
    const sign = change > 0 ? '+' : change < 0 ? '-' : '';
    const amount = Math.abs(change * 100).toFixed(1);
    return changeAs === 'points' ? `${sign}${amount} pts` : `${sign}${amount}%`;
}

/**
 * Fetch the widget's figures and set its display state to match. Resolves with what to render, or
 * `undefined` when the widget is showing a loading, empty or incomplete state instead.
 *
 * The value is the one for the last period the query returns, compared with the period before it.
 * `isCurrent` says whether this is still the widget's latest load: a superseded load leaves the
 * display state alone, and the caller should only render the result while `isCurrent()` holds.
 */
export async function loadHeadlineKpi(
    { widgetApi, dataMapping, format }: AgWidgetParams<HeadlineKpiDef>,
    hasLoaded: boolean,
    isCurrent: () => boolean
): Promise<HeadlineKpiView | undefined> {
    const value = dataMapping.value?.at(0);
    const period = dataMapping.period?.at(0);
    if (!value || !period) {
        widgetApi.setDisplayState('incompleteDataMapping');
        return undefined;
    }
    widgetApi.setDisplayState('loading', { prominent: !hasLoaded });
    // A headline is a fixed reference figure, so a click in another widget does not re-scope it.
    const response = await widgetApi.getData(
        { fields: [period, value], sort: [{ field: period, direction: 'asc' }] },
        { crossFilter: 'none' }
    );
    if (!isCurrent()) {
        return undefined;
    }
    const rows = response.results.rows.filter((row) => typeof row[value.key] === 'number');
    const latest = rows.at(-1);
    if (!latest) {
        widgetApi.setDisplayState('noData');
        return undefined;
    }

    const { target, higherIsBetter = true, changeAs = 'percent' } = format?.style ?? {};
    const latestValue: number = latest[value.key];
    const view: HeadlineKpiView = { value: widgetApi.formatFieldValue(value, latestValue) };

    const previous = rows.at(-2);
    const previousValue: number | undefined = previous?.[value.key];
    // A percentage has no meaning against zero; a difference in points does.
    if (previous && previousValue != null && (changeAs === 'points' || previousValue !== 0)) {
        const difference = latestValue - previousValue;
        // Taken against the earlier value's size, so a rise from a negative baseline reads as a rise.
        const change = changeAs === 'points' ? difference : difference / Math.abs(previousValue);
        const direction = getDirection(change);
        view.change = {
            label: formatChange(change, changeAs),
            comparison: `vs ${widgetApi.formatFieldValue(period, previous[period.key])}`,
            direction,
            sentiment: getSentiment(direction, higherIsBetter),
        };
    }

    if (target) {
        const share = latestValue / target;
        view.target = {
            percent: Math.min(Math.max(share * 100, 0), 100),
            label: `${Math.round(share * 100)}% of ${widgetApi.formatFieldValue(value, target)} target`,
        };
    }

    widgetApi.setDisplayState('displayed');
    return view;
}

export const HEADLINE_KPI_WIDGET: Omit<AgBaseWidgetDefinition<'headlineKpi', HeadlineKpiDef>, 'comp'> = {
    id: 'headlineKpi',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 6H21V12H3V6Z" fill="var(--ag-chart-palette-fills-1-color, #5090DC)"/>
<path d="M24 12L28 6L32 12H24Z" fill="var(--ag-chart-palette-fills-3-color, #5FCCC8)"/>
<path d="M3 22H29V26H3V22Z" fill="var(--ag-border-color, #B3B4B4)"/>
<path d="M3 22H21V26H3V22Z" fill="var(--ag-chart-palette-fills-2-color, #43964E)"/>
</svg>`,
    label: 'Headline KPI',
    dataMapping: {
        value: {
            type: 'field',
            supportedRoles: ['numeric'],
            requires: { cardinality: 'one' },
            required: true,
        },
        period: {
            type: 'field',
            supportedRoles: ['temporal', 'category'],
            requires: { cardinality: 'many' },
            required: true,
        },
    },
    form: (params: AgWidgetFormParams<HeadlineKpiDef>) => {
        const defaultForm = params.createDefaults({
            dataMappingItems: [
                { key: 'value', label: 'Value' },
                { key: 'period', label: 'Compare By' },
            ],
        });
        const [setup, formatTab] = defaultForm.items;
        // The widget ignores cross filters, so the section's setting would do nothing.
        setup.items = setup.items.filter((item) => !(item.type === 'section' && item.key === 'crossFilter'));
        formatTab.items.push({
            type: 'section',
            key: 'headlineKpi',
            label: 'Headline KPI',
            items: [
                {
                    type: 'group',
                    key: 'change',
                    label: 'Change',
                    defaultExpanded: false,
                    items: [
                        {
                            type: 'select',
                            id: 'format.style.changeAs',
                            label: 'Show As',
                            defaultValue: 'percent',
                            items: [
                                { label: 'Percentage', value: 'percent' },
                                { label: 'Percentage Points', value: 'points' },
                            ],
                        },
                        {
                            type: 'toggle',
                            id: 'format.style.higherIsBetter',
                            label: 'Higher Is Better',
                            defaultValue: true,
                        },
                    ],
                },
                {
                    type: 'group',
                    key: 'target',
                    label: 'Target',
                    defaultExpanded: false,
                    items: [{ type: 'optional-number', id: 'format.style.target', label: 'Value' }],
                },
            ],
        });
        return defaultForm;
    },
    defaultSize: { width: 300, height: 140 },
    minSize: { width: 180, height: 100 },
    ai: {
        description:
            'Shows a measure for its latest period in large type, its change on the period before as a coloured up or down badge, and progress towards an optional target.',
    },
};
