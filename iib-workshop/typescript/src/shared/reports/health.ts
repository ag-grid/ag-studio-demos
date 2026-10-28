import type { AgPageState, AgSchemaState } from 'ag-studio';

import { LONGEVITY_EVIDENCE_SOURCE, LONGEVITY_LINKS_SOURCE, LONGEVITY_SOURCE } from '../data/longevity';
import type { AppRegistry } from '../widgets/registry';
import { span } from './layout';

// The chart titles state findings checked against the data; re-check them if the data is regenerated.

const L = LONGEVITY_SOURCE;
const years = `[${L}.yearsGainedOrLost]`;

/**
 * The report's own calculations. The keys are the ids widgets reference, and each `expression`
 * is in the typed syntax a participant writes in the Edit panel.
 */
const CALCULATIONS = {
    yearsGained: {
        name: 'Years Gained',
        description: 'Years Gained or Lost where it adds years, otherwise 0.',
        expression: `IF(${years} > 0, ${years}, 0)`,
        format: 'decimalFormat',
        isMeasure: false,
    },
    yearsLost: {
        name: 'Years Lost',
        description: 'Years Gained or Lost where it costs years, as a positive number, otherwise 0.',
        expression: `IF(${years} < 0, ABS(${years}), 0)`,
        format: 'decimalFormat',
        isMeasure: false,
    },
    effectSize: {
        name: 'Size of Effect',
        description: 'How many years an intervention moves life expectancy, whichever way it moves it.',
        expression: `ABS(${years})`,
        format: 'decimalFormat',
        isMeasure: false,
    },
    effectBand: {
        name: 'Effect Band',
        description: 'Size of Effect grouped into four bands.',
        expression: `IF(ABS(${years}) >= 10, "10+ years", IF(ABS(${years}) >= 5, "5-10 years", IF(ABS(${years}) >= 2, "2-5 years", "Under 2 years")))`,
        format: 'textFormat',
        isMeasure: false,
    },
    strongEvidence: {
        name: 'Strong Evidence (1 or 0)',
        description: '1 where the evidence is Strong, otherwise 0. Sum it to count interventions with strong evidence.',
        expression: `IF([${L}.evidenceStrength] = "Strong", 1, 0)`,
        format: 'integerFormat',
        isMeasure: false,
    },
    interventionCount: {
        name: 'Interventions',
        description: 'How many interventions are in view. A measure, so it is already aggregated.',
        expression: `COUNTD([${L}.interventionId])`,
        format: 'integerFormat',
        isMeasure: true,
    },
} as const;

type CalculationId = keyof typeof CALCULATIONS;

/**
 * A calculated column or measure, as a widget references it: by its bare id, with no table
 * prefix. A measure takes no aggregation, since it is already aggregated.
 */
const calc = (id: CalculationId, aggregation?: 'sum' | 'avg' | 'min' | 'max') =>
    aggregation ? [{ id, aggregation }] : [{ id }];

const field = (table: string, id: string) => [{ id: `${table}.${id}` }];
const agg = (table: string, id: string, aggregation: 'sum' | 'avg' | 'min' | 'max' | 'countd') => [
    { id: `${table}.${id}`, aggregation },
];

const title = (text: string) => ({ title: { enabled: true, text } });
const titled = (text: string, subtitle: string) => ({
    title: { enabled: true, text },
    subtitle: { enabled: true, text: subtitle },
});
const caption = (text: string) => ({ caption: { enabled: true, text } });
const legendBelow = { theme: { common: { legend: { enabled: true, position: 'bottom' as const } } } };

const widgets = {
    pageTitle: {
        type: 'text' as const,
        format: {
            style: {
                text: 'Live long & prosper: what adds years to a life, and what takes them away',
                typography: { fontSize: 25 },
            },
        },
        dataMapping: {},
    },
    interventions: {
        type: 'value' as const,
        format: caption('Interventions studied'),
        dataMapping: { value: calc('interventionCount') },
    },
    biggestGain: {
        type: 'value' as const,
        format: caption('Most years gained'),
        dataMapping: { value: agg(L, 'yearsGainedOrLost', 'max') },
    },
    biggestLoss: {
        type: 'value' as const,
        format: caption('Most years lost'),
        dataMapping: { value: calc('yearsLost', 'max') },
    },
    strongEvidence: {
        type: 'value' as const,
        format: caption('Backed by strong evidence'),
        dataMapping: { value: calc('strongEvidence', 'sum') },
    },
    effectFilter: {
        type: 'button-filter' as const,
        format: title('Effect'),
        dataMapping: { value: field(L, 'effect') },
    },
    evidenceFilter: {
        type: 'button-filter' as const,
        format: title('Strength of evidence'),
        dataMapping: { value: field(L, 'evidenceStrength') },
    },
    /** The hero: every intervention on one diverging axis, largest gain first. */
    yearsByIntervention: {
        type: 'bar-chart-grouped' as const,
        format: title('Years gained or lost, by intervention'),
        dataMapping: { categoryKey: field(L, 'intervention'), valueKey: agg(L, 'yearsGainedOrLost', 'sum') },
        sort: [{ field: { id: `${L}.yearsGainedOrLost`, aggregation: 'sum' as const }, direction: 'desc' as const }],
    },
    /** Evidence Score comes across the join to Evidence Levels. */
    effectVsEvidence: {
        type: 'scatter-chart' as const,
        format: titled(
            'The biggest gains rest on the thinnest evidence',
            'Five of the seven gains of 10 years or more are only suggestive; three of the four largest losses are strong'
        ),
        dataMapping: {
            categoryKey: agg(L, 'yearsGainedOrLost', 'sum'),
            valueKey: agg(LONGEVITY_EVIDENCE_SOURCE, 'evidenceScore', 'avg'),
            groupByKey: field(L, 'intervention'),
        },
    },
    effectBands: {
        type: 'donut-chart' as const,
        format: titled(
            'Only 3 of the 35 move life expectancy by under 2 years',
            'Interventions by Effect Band, a calculated column'
        ),
        dataMapping: { categoryKey: calc('effectBand'), valueKey: calc('interventionCount') },
        sort: [{ field: { id: 'interventionCount' }, direction: 'desc' as const }],
    },
    effectTreemap: {
        type: 'treemap-chart' as const,
        format: title('Every intervention, sized by how far it moves life expectancy'),
        dataMapping: {
            categoryKey: [...field(L, 'effect'), ...field(L, 'intervention')],
            valueKey: calc('effectSize', 'sum'),
        },
    },
    gainsAndLossesByEvidence: {
        type: 'column-chart-grouped' as const,
        format: {
            ...titled(
                'Two-thirds of the years claimed rest on suggestive evidence',
                'Total years gained and lost across the interventions at each level of evidence'
            ),
            style: legendBelow,
        },
        dataMapping: {
            categoryKey: field(L, 'evidenceStrength'),
            valueKey: [...calc('yearsGained', 'sum'), ...calc('yearsLost', 'sum')],
        },
    },
    /** Counts rows in Source Links, the one place this dashboard crosses that join. */
    citedWebsites: {
        type: 'grid' as const,
        format: title('Most-cited websites'),
        dataMapping: {
            cols: [...field(LONGEVITY_LINKS_SOURCE, 'website'), ...agg(LONGEVITY_LINKS_SOURCE, 'url', 'countd')],
        },
        sort: [
            {
                field: { id: `${LONGEVITY_LINKS_SOURCE}.url`, aggregation: 'countd' as const },
                direction: 'desc' as const,
            },
        ],
    },
    evidenceTable: {
        type: 'grid' as const,
        format: title('The evidence'),
        dataMapping: {
            cols: [
                ...field(L, 'intervention'),
                ...agg(L, 'yearsGainedOrLost', 'sum'),
                ...field(L, 'yearsAsPublished'),
                ...field(L, 'evidenceStrength'),
                ...field(L, 'sexesAffected'),
                ...field(L, 'note'),
                ...field(L, 'sources'),
            ],
        },
        sort: [{ field: { id: `${L}.yearsGainedOrLost`, aggregation: 'sum' as const }, direction: 'desc' as const }],
    },
};

/** The page's calculations, as the report's `schema` in `index.ts` carries them. */
export const healthSchema: AgSchemaState = {
    // No `format` here: a field state's `format` holds the format's options, and a format
    // type name placed there is applied as a pattern, garbling every value. The type goes
    // in `expressions` below.
    fields: Object.fromEntries(
        Object.entries(CALCULATIONS).map(([id, { name, description, expression }]) => [
            id,
            { name, description, expression },
        ])
    ),
    expressions: Object.entries(CALCULATIONS).map(([id, { isMeasure, format }]) => ({
        id,
        tableId: L,
        isMeasure,
        format,
    })),
};

/** The page, as `initialState` in `index.ts` lists it. */
export const healthPage: AgPageState<AppRegistry> = {
    id: 'health',
    widgets,
    widgetLayout: {
        pageTitle: span(0, 0, 24, 5),
        interventions: span(0, 5, 6, 8),
        biggestGain: span(6, 5, 6, 8),
        biggestLoss: span(12, 5, 6, 8),
        strongEvidence: span(18, 5, 6, 8),
        effectFilter: span(0, 13, 12, 9),
        evidenceFilter: span(12, 13, 12, 9),
        // 35 bars need the height; the two smaller charts stack beside it.
        yearsByIntervention: span(0, 22, 14, 48),
        effectVsEvidence: span(14, 22, 10, 24),
        effectBands: span(14, 46, 10, 24),
        effectTreemap: span(0, 70, 24, 26),
        gainsAndLossesByEvidence: span(0, 96, 14, 26),
        citedWebsites: span(14, 96, 10, 26),
        evidenceTable: span(0, 122, 24, 30),
    },
};
