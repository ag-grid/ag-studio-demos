import { SOURCE } from '../data/sources';

/** Every widget type AG Studio ships, mapped onto the `(demo)` tables, with its type id as subtitle. */

type Agg = 'sum' | 'avg' | 'min' | 'max' | 'countd';

/**
 * Two accessors per table rather than one with an optional aggregation: a conditional spread
 * widens `aggregation` to include `undefined`, which the built-in widget definitions reject.
 */
const from = (source: string) => ({
    dim: (...fields: string[]) => fields.map((field) => ({ id: `${source}.${field}` })),
    agg: (field: string, aggregation: Agg) => [{ id: `${source}.${field}`, aggregation }],
});

const portfolio = from(SOURCE.portfolio);
const sales = from(SOURCE.sales);
const monthly = from(SOURCE.monthly);
const stores = from(SOURCE.stores);
const readings = from(SOURCE.readings);

const label = (name: string, type: string) => ({
    title: { enabled: true, text: name },
    subtitle: { enabled: true, text: type },
});

/**
 * The AG Studio mark, as a data URI. The image widget takes a `src` and nothing else, so it
 * needs something to point at; a remote URL would make the gallery depend on the network.
 */
const AG_MARK =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
            `<rect x="14" y="62" width="18" height="44" rx="3" fill="#FF6B5B"/>` +
            `<rect x="40" y="38" width="18" height="68" rx="3" fill="#F5C542"/>` +
            `<rect x="66" y="50" width="18" height="56" rx="3" fill="#3FC1C9"/>` +
            `<rect x="92" y="20" width="18" height="86" rx="3" fill="#9B8BD9"/>` +
            `</svg>`
    );

/** Ordered as the widget menu orders them. */
export const BUILT_IN_WIDGETS = {
    // Column
    columnGrouped: {
        type: 'column-chart-grouped' as const,
        format: label('Column, grouped', 'column-chart-grouped'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            valueKey: [...sales.agg('revenue', 'sum'), ...sales.agg('units', 'sum')],
        },
    },
    columnStacked: {
        type: 'column-chart-stacked' as const,
        format: label('Column, stacked', 'column-chart-stacked'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            legendKey: sales.dim('region'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },
    columnStacked100: {
        type: 'column-chart-stacked-100' as const,
        format: label('Column, stacked to 100%', 'column-chart-stacked-100'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            legendKey: sales.dim('region'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },

    // Bar
    barGrouped: {
        type: 'bar-chart-grouped' as const,
        format: label('Bar, grouped', 'bar-chart-grouped'),
        dataMapping: {
            categoryKey: sales.dim('region'),
            valueKey: [...sales.agg('revenue', 'sum'), ...sales.agg('units', 'sum')],
        },
    },
    barStacked: {
        type: 'bar-chart-stacked' as const,
        format: label('Bar, stacked', 'bar-chart-stacked'),
        dataMapping: {
            categoryKey: sales.dim('region'),
            legendKey: sales.dim('quarter'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },
    barStacked100: {
        type: 'bar-chart-stacked-100' as const,
        format: label('Bar, stacked to 100%', 'bar-chart-stacked-100'),
        dataMapping: {
            categoryKey: sales.dim('region'),
            legendKey: sales.dim('quarter'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },

    // Line and area
    line: {
        type: 'line-chart' as const,
        format: label('Line', 'line-chart'),
        dataMapping: { categoryKey: monthly.dim('month'), valueKey: monthly.agg('revenue', 'sum') },
    },
    area: {
        type: 'area-chart' as const,
        format: label('Area', 'area-chart'),
        dataMapping: { categoryKey: monthly.dim('month'), valueKey: monthly.agg('revenue', 'sum') },
    },
    areaStacked: {
        type: 'area-chart-stacked' as const,
        format: label('Area, stacked', 'area-chart-stacked'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            legendKey: sales.dim('region'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },
    areaStacked100: {
        type: 'area-chart-stacked-100' as const,
        format: label('Area, stacked to 100%', 'area-chart-stacked-100'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            legendKey: sales.dim('region'),
            valueKey: sales.agg('revenue', 'sum'),
        },
    },

    // Combo
    comboGrouped: {
        type: 'combo-chart-grouped-column-line' as const,
        format: label('Combo, grouped column and line', 'combo-chart-grouped-column-line'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            valueKey: sales.agg('revenue', 'sum'),
            secondaryValueKey: sales.agg('units', 'sum'),
        },
    },
    comboStacked: {
        type: 'combo-chart-stacked-column-line' as const,
        format: label('Combo, stacked column and line', 'combo-chart-stacked-column-line'),
        dataMapping: {
            categoryKey: sales.dim('quarter'),
            valueKey: sales.agg('revenue', 'sum'),
            secondaryValueKey: sales.agg('units', 'sum'),
        },
    },

    // Scatter
    scatter: {
        type: 'scatter-chart' as const,
        format: label('Scatter', 'scatter-chart'),
        dataMapping: {
            categoryKey: portfolio.agg('revenue', 'sum'),
            valueKey: portfolio.agg('growth', 'avg'),
            groupByKey: portfolio.dim('product'),
        },
    },
    bubble: {
        type: 'bubble-chart' as const,
        format: label('Bubble', 'bubble-chart'),
        dataMapping: {
            categoryKey: portfolio.agg('revenue', 'sum'),
            valueKey: portfolio.agg('growth', 'avg'),
            sizeKey: portfolio.agg('customers', 'sum'),
            groupByKey: portfolio.dim('product'),
        },
    },

    // Proportional
    pie: {
        type: 'pie-chart' as const,
        format: label('Pie', 'pie-chart'),
        dataMapping: { categoryKey: sales.dim('region'), valueKey: sales.agg('revenue', 'sum') },
    },
    donut: {
        type: 'donut-chart' as const,
        format: label('Donut', 'donut-chart'),
        dataMapping: { categoryKey: sales.dim('region'), valueKey: sales.agg('revenue', 'sum') },
    },

    // Polar
    nightingale: {
        type: 'nightingale-chart' as const,
        format: label('Nightingale', 'nightingale-chart'),
        dataMapping: { categoryKey: stores.dim('region'), valueKey: stores.agg('revenue', 'sum') },
    },
    radialBar: {
        type: 'radial-bar-chart' as const,
        format: label('Radial bar', 'radial-bar-chart'),
        dataMapping: { categoryKey: stores.dim('region'), valueKey: stores.agg('revenue', 'sum') },
    },
    radialColumn: {
        type: 'radial-column-chart' as const,
        format: label('Radial column', 'radial-column-chart'),
        dataMapping: { categoryKey: stores.dim('region'), valueKey: stores.agg('revenue', 'sum') },
    },
    radarLine: {
        type: 'radar-line-chart' as const,
        format: label('Radar, line', 'radar-line-chart'),
        dataMapping: { categoryKey: readings.dim('machine'), valueKey: readings.agg('cycleSeconds', 'avg') },
    },
    radarArea: {
        type: 'radar-area-chart' as const,
        format: label('Radar, area', 'radar-area-chart'),
        dataMapping: { categoryKey: readings.dim('machine'), valueKey: readings.agg('cycleSeconds', 'avg') },
    },

    // Progression
    funnel: {
        type: 'funnel-chart' as const,
        format: label('Funnel', 'funnel-chart'),
        dataMapping: { categoryKey: sales.dim('region'), valueKey: sales.agg('revenue', 'sum') },
    },
    coneFunnel: {
        type: 'cone-funnel-chart' as const,
        format: label('Cone funnel', 'cone-funnel-chart'),
        dataMapping: { categoryKey: sales.dim('region'), valueKey: sales.agg('revenue', 'sum') },
    },
    pyramid: {
        type: 'pyramid-chart' as const,
        format: label('Pyramid', 'pyramid-chart'),
        dataMapping: { categoryKey: sales.dim('region'), valueKey: sales.agg('revenue', 'sum') },
    },

    // Hierarchy. Two category fields, so the chart has an outer ring and an inner one.
    treemap: {
        type: 'treemap-chart' as const,
        format: label('Treemap', 'treemap-chart'),
        dataMapping: { categoryKey: stores.dim('region', 'county'), valueKey: stores.agg('revenue', 'sum') },
    },
    sunburst: {
        type: 'sunburst-chart' as const,
        format: label('Sunburst', 'sunburst-chart'),
        dataMapping: { categoryKey: stores.dim('region', 'county'), valueKey: stores.agg('revenue', 'sum') },
    },

    // KPI
    value: {
        type: 'value' as const,
        format: label('Value', 'value'),
        dataMapping: { value: monthly.agg('revenue', 'sum'), sparklineX: monthly.dim('month') },
    },
    radialGauge: {
        type: 'radial-gauge' as const,
        format: label('Radial gauge', 'radial-gauge'),
        dataMapping: { value: portfolio.agg('growth', 'avg') },
    },
    linearGauge: {
        type: 'linear-gauge' as const,
        format: label('Linear gauge', 'linear-gauge'),
        dataMapping: { value: portfolio.agg('growth', 'avg') },
    },

    // Tables
    grid: {
        type: 'grid' as const,
        format: label('Grid', 'grid'),
        dataMapping: {
            cols: [
                ...portfolio.dim('product'),
                ...portfolio.agg('revenue', 'sum'),
                ...portfolio.agg('growth', 'avg'),
                ...portfolio.agg('customers', 'sum'),
            ],
        },
    },
    pivotGrid: {
        type: 'pivot-grid' as const,
        format: label('Pivot grid', 'pivot-grid'),
        dataMapping: {
            rows: sales.dim('region'),
            columns: sales.dim('quarter'),
            values: sales.agg('revenue', 'sum'),
        },
    },

    // Filters
    listFilter: {
        type: 'list-filter' as const,
        format: label('List filter', 'list-filter'),
        dataMapping: { value: sales.dim('region') },
    },
    buttonFilter: {
        type: 'button-filter' as const,
        format: label('Button filter', 'button-filter'),
        dataMapping: { value: sales.dim('quarter') },
    },
    dateFilter: {
        type: 'date-filter' as const,
        format: label('Date filter', 'date-filter'),
        dataMapping: { value: monthly.dim('monthStart') },
    },

    // Static content
    text: {
        type: 'text' as const,
        format: {
            ...label('Text', 'text'),
            style: {
                text: 'A text widget holds prose rather than data. This gallery uses one for every heading on the page.',
                typography: { fontSize: 13 },
            },
        },
        dataMapping: {},
    },
    image: {
        type: 'image' as const,
        format: {
            ...label('Image', 'image'),
            style: { src: AG_MARK, objectFit: 'scale-down' as const },
        },
        dataMapping: {},
    },
};

/** Gallery order, three to a row. */
export const BUILT_IN_ORDER = Object.keys(BUILT_IN_WIDGETS) as (keyof typeof BUILT_IN_WIDGETS)[];
