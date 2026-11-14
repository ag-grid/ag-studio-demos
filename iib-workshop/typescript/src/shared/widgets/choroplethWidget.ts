import type {
    AgChartOptions,
    AgMapShapeSeriesItemStylerParams,
    AgMapShapeSeriesTooltipRendererParams,
    AgNodeClickEvent,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';
import type { AgWidgetApi, AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';

import { toTitleCase } from '../data/format';
import type { ukTopology } from '../data/ukTopology';
import { IIB, fill } from '../theme';
import { ChartWidgetBase } from './chartWidgetBase';
import { tooltipContent } from './tooltip';
import type { ChoroplethDef } from './types';

// A type-only import, so the outlines stay out of the bundle until `loadTopology` runs.
type UkTopology = typeof ukTopology;

let topology: Promise<UkTopology> | undefined;

/**
 * Loaded on first use, since only a page with the choropleth needs the county outlines, and
 * title-cased once so the idKey values in the chart data and the topology match without
 * forcing raw uppercase names into the UI.
 */
const loadTopology = (): Promise<UkTopology> =>
    (topology ??= import('../data/ukTopology').then(({ ukTopology: outlines }) => ({
        ...outlines,
        features: outlines.features.map((f) => ({
            ...f,
            properties: { ...f.properties, name: toTitleCase(f.properties.name) },
        })),
    })));

interface Fields {
    county: AgWidgetField;
    value: AgWidgetField;
}

/** One county as the map-shape series receives it. */
interface CountyDatum {
    /** The county as the data holds it, which is what a cross-filter has to match. */
    rawName: string;
    /** Title-cased, to join to the topology and for display. */
    name: string;
    value: number;
}

/**
 * A click on the background series carries a topology feature rather than a county row, so
 * every county property is treated as possibly absent.
 */
type CountyClickEvent = AgNodeClickEvent<'seriesNodeClick', Partial<CountyDatum> | undefined>;

/** Ctrl/cmd held during the click or key press, which adds to the selection rather than replacing it. */
function isMultiSelect(event?: Event): boolean {
    const source = event as Partial<Pick<MouseEvent, 'ctrlKey' | 'metaKey'>> | undefined;
    return source?.ctrlKey === true || source?.metaKey === true;
}

function tooltip(
    datum: CountyDatum | undefined,
    widgetApi: AgWidgetApi,
    valueField: AgWidgetField
): AgTooltipRendererResult {
    const value = widgetApi.formatFieldValue(valueField, datum?.value);
    return tooltipContent(String(datum?.name ?? ''), [[valueField.name, value]]);
}

/**
 * Based on the custom widgets example in the AG Studio documentation. Click a county to
 * cross-filter the rest of the report; ctrl/cmd-click to add to the selection; click the
 * background to clear.
 */
export class ChoroplethWidget extends ChartWidgetBase<ChoroplethDef, Fields> {
    protected resolveFields(m: AgWidgetDataMapping<ChoroplethDef>): Fields | null {
        const county = m.county?.[0];
        const value = m.value?.[0];
        return county && value ? { county, value } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<ChoroplethDef>,
        f: Fields
    ): Promise<AgChartOptions | null> {
        const query = { fields: [f.county, f.value] };

        // Two parallel queries:
        // - base: ignores cross-filters, keeps all counties visible for context
        // - filtered: respects cross-filters, drives which counties stay lit
        const [baseResponse, filteredResponse, counties] = await Promise.all([
            widgetApi.getData(query, { queryId: 'base', crossFilter: 'none' }),
            widgetApi.getData(query, { queryId: 'filtered' }),
            loadTopology(),
        ]);

        const baseRows = baseResponse.results.rows;
        if (!baseRows.length) {
            return null;
        }

        const baseData = baseRows.map((row): CountyDatum => ({
            rawName: row[f.county.key] as string,
            name: toTitleCase(row[f.county.key] as string),
            value: row[f.value.key] as number,
        }));

        const filteredNames = new Set(
            filteredResponse.results.rows.map((row) => toTitleCase(row[f.county.key] as string))
        );
        const hasCrossFilter = filteredNames.size < baseData.length;

        // Place colour stops at min, geometric mean and max. The geometric mean is the
        // logarithmic midpoint, so equal visual steps correspond to equal multiplicative
        // steps in the data. Using actual values keeps the legend labels in real units.
        const values = baseData.map((d) => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const geoMid = Math.sqrt(minVal * maxVal);

        return {
            gradientLegend: {
                enabled: true,
                scale: {
                    label: { formatter: ({ value }: { value: unknown }) => widgetApi.formatFieldValue(f.value, value) },
                    interval: { values: [minVal, maxVal], step: 3000 },
                },
            },
            topology: counties,
            listeners: {
                seriesNodeClick: ({ datum, event }: CountyClickEvent) => {
                    const rawName = datum?.rawName;
                    if (rawName == null) {
                        return;
                    }
                    // Studio holds the selection, so a reset from another widget or a restored
                    // report is already reflected. A plain click replaces the selection, and
                    // repeating the sole selected county clears it.
                    widgetApi.toggleCrossFilter({
                        type: 'value',
                        field: f.county,
                        value: rawName,
                        group: 0,
                        reset: !isMultiSelect(event),
                    });
                },
                click: () => widgetApi.resetCrossFilter(),
            },
            series: [
                { type: 'map-shape-background', strokeWidth: 0.5, fill: IIB.raised, stroke: IIB.border },
                {
                    type: 'map-shape',
                    data: baseData,
                    idKey: 'name',
                    colorKey: 'value',
                    // Teal to mustard to coral, so the ramp stays inside the app's palette
                    // rather than a generic yellow-orange-red, which reads as a foreign scheme
                    // on the dark ground.
                    colorScale: {
                        fills: [
                            { color: fill(1), stop: minVal },
                            { color: fill(2), stop: geoMid },
                            { color: fill(0), stop: maxVal },
                        ],
                    },
                    colorName: 'Revenue',
                    // Dim counties outside the cross-filter selection per-datum, so the
                    // colour scale and gradient legend stay stable on a single series.
                    itemStyler: hasCrossFilter
                        ? ({ datum }: Pick<AgMapShapeSeriesItemStylerParams<CountyDatum>, 'datum'>) =>
                              filteredNames.has(datum.name) ? {} : { fillOpacity: 0.15, strokeOpacity: 0.1 }
                        : undefined,
                    tooltip: {
                        renderer: ({ datum }: AgMapShapeSeriesTooltipRendererParams<CountyDatum>) =>
                            tooltip(datum, widgetApi, f.value),
                    },
                },
            ],
        };
    }
}
