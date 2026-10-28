import type { AgBaseWidgetDefinition, AgWidgetFormParams, AgWidgetParams } from 'ag-studio';

import type { AnalystConsensusDef } from './interfaces';

/**
 * The Analyst Consensus custom widget, minus its component. Each framework variant renders it with
 * a component of its own, so only the definition and the figures it shows are shared.
 */

export const DEFAULT_EQUAL_WEIGHT_BAND = 5;

const RATINGS = {
    overweight: 'Overweight',
    underweight: 'Underweight',
    equalWeight: 'Equal Weight',
};

export type AnalystRating = keyof typeof RATINGS;

export interface AnalystConsensusView {
    rating: AnalystRating;
    ratingLabel: string;
    /** E.g. "12 analysts"; empty when no analyst count is mapped. */
    countLabel: string;
}

function getRating(targetPrice: number, lastClose: number, equalWeightBand: number): AnalystRating {
    const upside = targetPrice / lastClose - 1;
    const band = equalWeightBand / 100;
    if (upside > band) {
        return 'overweight';
    }
    if (upside < -band) {
        return 'underweight';
    }
    return 'equalWeight';
}

/**
 * Fetch the widget's figures and set its display state to match. Resolves with what to render, or
 * `undefined` when the widget is showing a loading, empty or incomplete state instead.
 *
 * `isCurrent` says whether this is still the widget's latest load. A refresh can start before the
 * previous load's data arrives, so a superseded load leaves the display state alone; the caller
 * should likewise only render the result while `isCurrent()` holds.
 */
export async function loadAnalystConsensus(
    { widgetApi, dataMapping, format }: AgWidgetParams<AnalystConsensusDef>,
    hasLoaded: boolean,
    isCurrent: () => boolean
): Promise<AnalystConsensusView | undefined> {
    const targetPrice = dataMapping.targetPrice?.at(0);
    const lastClose = dataMapping.lastClose?.at(0);
    const analystCount = dataMapping.analystCount?.at(0);
    if (!targetPrice || !lastClose) {
        widgetApi.setDisplayState('incompleteDataMapping');
        return undefined;
    }
    widgetApi.setDisplayState('loading', { prominent: !hasLoaded });
    const fields = analystCount ? [targetPrice, lastClose, analystCount] : [targetPrice, lastClose];
    const response = await widgetApi.getData({ fields });
    if (!isCurrent()) {
        return undefined;
    }
    const row = response.results.rows.at(0);
    const target = row?.[targetPrice.key];
    const close = row?.[lastClose.key];
    if (typeof target !== 'number' || typeof close !== 'number' || close === 0) {
        widgetApi.setDisplayState('noData');
        return undefined;
    }

    const rating = getRating(target, close, format?.style?.equalWeightBand ?? DEFAULT_EQUAL_WEIGHT_BAND);
    const count = analystCount && row?.[analystCount.key];
    const countLabel =
        analystCount && count != null
            ? `${widgetApi.formatFieldValue(analystCount, count)} ${count === 1 ? 'analyst' : 'analysts'}`
            : '';
    widgetApi.setDisplayState('displayed');
    return { rating, ratingLabel: RATINGS[rating], countLabel };
}

export const ANALYST_CONSENSUS_WIDGET: Omit<AgBaseWidgetDefinition<'analystConsensus', AnalystConsensusDef>, 'comp'> = {
    id: 'analystConsensus',
    icon: {
        url: 'https://www.ag-grid.com/studio/images/brandmark.svg',
    },
    label: 'Analyst Consensus',
    dataMapping: {
        targetPrice: {
            type: 'field',
            supportedRoles: ['numeric'],
            requires: { cardinality: 'one' },
            required: true,
        },
        lastClose: {
            type: 'field',
            supportedRoles: ['numeric'],
            requires: { cardinality: 'one' },
            required: true,
        },
        analystCount: {
            type: 'field',
            supportedRoles: ['category', 'numeric'],
            requires: { cardinality: 'one' },
        },
    },
    form: (params: AgWidgetFormParams<AnalystConsensusDef>) => {
        const defaultForm = params.createDefaults({
            dataMappingItems: [
                { key: 'targetPrice', label: 'Target Price' },
                { key: 'lastClose', label: 'Last Close' },
                { key: 'analystCount', label: 'Analyst Count' },
            ],
        });
        defaultForm.items[1].items.push({
            type: 'number',
            id: 'format.style.equalWeightBand',
            label: 'Equal Weight Band (%)',
            defaultValue: DEFAULT_EQUAL_WEIGHT_BAND,
        });
        return defaultForm;
    },
    defaultSize: { width: 300, height: 100 },
    minSize: { width: 150, height: 60 },
    ai: {
        description:
            'Rates a stock Overweight, Underweight or Equal Weight by comparing the average analyst price target with the last close, and shows how many analysts cover it.',
    },
};
