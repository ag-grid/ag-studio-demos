import type { AgChartOptions, AgSankeySeriesTooltipRendererParams } from 'ag-charts-enterprise';
import type { AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';

import { ChartWidgetBase } from './chartWidgetBase';
import { tooltipContent } from './tooltip';
import type { SankeyDef } from './types';

interface Fields {
    from: AgWidgetField;
    to: AgWidgetField;
    value: AgWidgetField;
}

/** A node carries its `id`; a link carries the `from`/`to` pair of the row behind it. */
interface SankeyDatum {
    id?: string;
    from?: string;
    to?: string;
    size?: number;
}

/**
 * Based on the custom widgets example in the AG Studio documentation, including its
 * cross-filter opt-out.
 */
export class SankeyWidget extends ChartWidgetBase<SankeyDef, Fields> {
    protected resolveFields(m: AgWidgetDataMapping<SankeyDef>): Fields | null {
        const from = m.sources?.[0];
        const to = m.targets?.[0];
        const value = m.value?.[0];
        return from && to && value ? { from, to, value } : null;
    }

    protected async buildOptions({ widgetApi }: AgWidgetParams<SankeyDef>, f: Fields): Promise<AgChartOptions | null> {
        // Opts out of cross filtering, so the flow diagram covers the whole dataset.
        const { results } = await widgetApi.getData({ fields: [f.from, f.to, f.value] }, { crossFilter: 'none' });
        if (!results.rows.length) {
            return null;
        }

        const data = results.rows.map((row) => ({
            from: widgetApi.formatFieldValue(f.from, row[f.from.key]),
            to: widgetApi.formatFieldValue(f.to, row[f.to.key]),
            size: row[f.value.key] as number,
        }));

        return {
            data,
            series: [
                {
                    type: 'sankey',
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    sizeName: 'Revenue',
                    tooltip: {
                        renderer: ({ datum }: AgSankeySeriesTooltipRendererParams<SankeyDatum | undefined>) => {
                            if (datum == null) {
                                return '';
                            }
                            const label = datum.id ?? `${datum.from} → ${datum.to}`;
                            const size = widgetApi.formatFieldValue(f.value, datum.size);
                            return tooltipContent(label, [[f.value.name, size]]);
                        },
                    },
                },
            ],
        };
    }
}
