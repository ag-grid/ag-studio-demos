import type {
    AgBaseWidgetDefinition,
    AgWidgetDataFormat,
    AgWidgetFieldReference,
    AgWidgetFormGroup,
    AgWidgetFormItemControl,
    AgWidgetFormParams,
    AgWidgetFormSection,
    AgWidgetParams,
} from 'ag-studio';

type FormTabItem<TId> = AgWidgetFormItemControl<TId> | AgWidgetFormGroup<TId> | AgWidgetFormSection<TId>;

/**
 * The Bar Gauge custom widget, minus its component: a Grafana-style LED bar per category, lit in
 * red, amber or green by threshold. Each framework variant renders it with a component of its own,
 * so only the definition and the figures it shows are shared.
 */

export interface BarGaugeStyle {
    /** The value a full bar stands for. Leave unset to scale to the largest value shown. */
    max?: number;
    /** Where amber starts, as a percentage of `max`. Below it a bar is red. */
    amberFrom?: number;
    /** Where green starts, as a percentage of `max`. */
    greenFrom?: number;
}

export interface BarGaugeDef {
    type: 'pcw-bar-gauge';
    dataMapping: {
        category: AgWidgetFieldReference[];
        value: AgWidgetFieldReference[];
    };
    format?: AgWidgetDataFormat<BarGaugeStyle>;
}

export type BarGaugeLevel = 'low' | 'mid' | 'high';

export interface BarGaugeRow {
    label: string;
    value: string;
    /** How much of the bar is lit, 0-100. */
    fill: number;
    level: BarGaugeLevel;
}

export interface BarGaugeView {
    rows: BarGaugeRow[];
    /** The thresholds as percentages of the bar, for the LED gradient. */
    amberFrom: number;
    greenFrom: number;
}

/**
 * A form tab's items less the Cross-Filtering section: the widget ignores cross filters, so the
 * section's setting would do nothing.
 */
export function withoutCrossFilterSection<TId>(items: FormTabItem<TId>[]): FormTabItem<TId>[] {
    return items.filter((item) => !(item.type === 'section' && item.key === 'crossFilter'));
}

const DEFAULT_AMBER_FROM = 50;
const DEFAULT_GREEN_FROM = 75;

function getLevel(fill: number, amberFrom: number, greenFrom: number): BarGaugeLevel {
    if (fill >= greenFrom) {
        return 'high';
    }
    return fill >= amberFrom ? 'mid' : 'low';
}

/**
 * Fetch the widget's figures and set its display state to match. Resolves with what to render, or
 * `undefined` when the widget is showing a loading, empty or incomplete state instead.
 *
 * `isCurrent` says whether this is still the widget's latest load: a superseded load leaves the
 * display state alone, and the caller should only render the result while `isCurrent()` holds.
 */
export async function loadBarGauge(
    { widgetApi, dataMapping, format }: AgWidgetParams<BarGaugeDef>,
    hasLoaded: boolean,
    isCurrent: () => boolean
): Promise<BarGaugeView | undefined> {
    const category = dataMapping.category?.at(0);
    const value = dataMapping.value?.at(0);
    if (!category || !value) {
        widgetApi.setDisplayState('incompleteDataMapping');
        return undefined;
    }
    widgetApi.setDisplayState('loading', { prominent: !hasLoaded });
    // Each bar is read against fixed thresholds, so a click in another widget does not re-scope it.
    const response = await widgetApi.getData(
        { fields: [category, value], sort: [{ field: value, direction: 'desc' }] },
        { crossFilter: 'none' }
    );
    if (!isCurrent()) {
        return undefined;
    }
    const rows = response.results.rows.filter((row) => typeof row[value.key] === 'number');
    if (!rows.length) {
        widgetApi.setDisplayState('noData');
        return undefined;
    }

    const { amberFrom = DEFAULT_AMBER_FROM, greenFrom = DEFAULT_GREEN_FROM } = format?.style ?? {};
    const max = format?.style?.max || Math.max(...rows.map((row): number => row[value.key]));
    widgetApi.setDisplayState('displayed');
    return {
        amberFrom,
        greenFrom,
        rows: rows.map((row) => {
            const rowValue: number = row[value.key];
            const fill = max > 0 ? Math.min(Math.max((rowValue / max) * 100, 0), 100) : 0;
            return {
                label: widgetApi.formatFieldValue(category, row[category.key]),
                value: widgetApi.formatFieldValue(value, rowValue),
                fill,
                level: getLevel(fill, amberFrom, greenFrom),
            };
        }),
    };
}

export const BAR_GAUGE_WIDGET: Omit<AgBaseWidgetDefinition<'pcw-bar-gauge', BarGaugeDef>, 'comp'> = {
    id: 'pcw-bar-gauge',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2 5H8V11H2V5ZM10 5H16V11H10V5ZM18 5H24V11H18V5ZM26 5H30V11H26V5Z" fill="#73BF69"/>
<path d="M2 13H8V19H2V13ZM10 13H16V19H10V13ZM18 13H24V19H18V13Z" fill="#FF9830"/>
<path d="M2 21H8V27H2V21ZM10 21H16V27H10V21Z" fill="#F2495C"/>
<path d="M18 21H24V27H18V21ZM26 21H30V27H26V21ZM26 13H30V19H26V13Z" fill="var(--ag-border-color, #B3B4B4)"/>
</svg>`,
    label: 'Bar Gauge',
    dataMapping: {
        category: {
            type: 'field',
            supportedRoles: ['category'],
            requires: { cardinality: 'many' },
            required: true,
        },
        value: {
            type: 'field',
            supportedRoles: ['numeric'],
            requires: { cardinality: 'one' },
            required: true,
        },
    },
    form: (params: AgWidgetFormParams<BarGaugeDef>) => {
        const defaultForm = params.createDefaults({
            dataMappingItems: [
                { key: 'category', label: 'Category' },
                { key: 'value', label: 'Value' },
            ],
        });
        const [setup, formatTab] = defaultForm.items;
        setup.items = withoutCrossFilterSection(setup.items);
        formatTab.items.push({
            type: 'section',
            key: 'barGauge',
            label: 'Bar Gauge',
            items: [
                {
                    type: 'group',
                    key: 'scale',
                    label: 'Scale',
                    defaultExpanded: false,
                    items: [{ type: 'optional-number', id: 'format.style.max', label: 'Maximum' }],
                },
                {
                    type: 'group',
                    key: 'thresholds',
                    label: 'Thresholds (% of Maximum)',
                    defaultExpanded: false,
                    items: [
                        {
                            type: 'number',
                            id: 'format.style.amberFrom',
                            label: 'Amber From',
                            defaultValue: DEFAULT_AMBER_FROM,
                        },
                        {
                            type: 'number',
                            id: 'format.style.greenFrom',
                            label: 'Green From',
                            defaultValue: DEFAULT_GREEN_FROM,
                        },
                    ],
                },
            ],
        });
        return defaultForm;
    },
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 200, height: 120 },
    ai: {
        description:
            'Shows one horizontal LED bar per category, lit red, amber or green by how close its value is to a maximum, with the value beside it.',
    },
};
