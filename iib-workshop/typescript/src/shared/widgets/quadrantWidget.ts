import type { AgChartInstance, AgQuadrantChartOptions, AgQuadrantTooltipRendererParams } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';
import type { AgTypeScriptComponent, AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';
import { getChartTheme } from 'ag-studio';

import { IIB, fill } from '../theme';
import { abbreviate, abbreviatedAxisLabel } from './axisFormat';
import './chartModules';
import { tooltipContent } from './tooltip';
import type { QuadrantDef, QuadrantRegionNames } from './types';

interface Fields {
    label: AgWidgetField;
    x: AgWidgetField;
    y: AgWidgetField;
    size: AgWidgetField;
}

/** One plotted point, on the flat keys the chart reads. */
interface QuadrantDatum {
    label: unknown;
    x: number;
    y: number;
    size: number;
}

/** Splits at the medians, so each region holds a meaningful share of the points. */
function median(values: number[]): number {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Region names, from the report if it set any and from the mapped field names otherwise. */
function regionNames(x: string, y: string, override?: QuadrantRegionNames): Required<QuadrantRegionNames> {
    return {
        topLeft: override?.topLeft ?? `Low ${x}, high ${y}`,
        topRight: override?.topRight ?? `High ${x}, high ${y}`,
        bottomLeft: override?.bottomLeft ?? `Low ${x}, low ${y}`,
        bottomRight: override?.bottomRight ?? `High ${x}, low ${y}`,
    };
}

const region = (fill: string, text: string) => ({
    fill,
    // A faint wash, because any stronger one behind the axis labels makes the numbers hard to
    // read, the coral region most of all. The markers carry the region's identity; the ground
    // only has to separate the quadrants.
    fillOpacity: 0.05,
    marker: { fill, fillOpacity: 0.9, stroke: fill },
    label: { text, color: IIB.text, fontSize: 11.5, fontWeight: 600 },
});

/** AG Charts' quadrant preset. Not a ChartWidgetBase: it has its own factory and no `series` array. */
export class QuadrantWidget implements AgTypeScriptComponent<AgWidgetParams<QuadrantDef>> {
    private readonly eGui = document.createElement('div');
    private chart: AgChartInstance<AgQuadrantChartOptions<QuadrantDatum>> | null = null;
    private hasLoaded = false;
    private generation = 0;

    init(params: AgWidgetParams<QuadrantDef>): Promise<void> {
        this.eGui.style.cssText = 'width: 100%; height: 100%;';
        return this.refresh(params);
    }

    refresh(params: AgWidgetParams<QuadrantDef>): Promise<void> {
        return this.load(params);
    }

    destroy(): void {
        // Invalidates a load still awaiting its query, so it cannot create a chart after this.
        ++this.generation;
        this.chart?.destroy();
        this.chart = null;
    }

    getGui(): HTMLDivElement {
        return this.eGui;
    }

    private resolveFields(m: AgWidgetDataMapping<QuadrantDef>): Fields | null {
        const label = m.label?.[0];
        const x = m.x?.[0];
        const y = m.y?.[0];
        const size = m.size?.[0];
        return label && x && y && size ? { label, x, y, size } : null;
    }

    private async load(params: AgWidgetParams<QuadrantDef>): Promise<void> {
        const generation = ++this.generation;
        const { api, widgetApi, dataMapping, format } = params;

        const f = this.resolveFields(dataMapping);
        if (!f) {
            widgetApi.setDisplayState('incompleteDataMapping');
            return;
        }
        widgetApi.setDisplayState('loading', { prominent: !this.hasLoaded });

        const { results } = await widgetApi.getData({ fields: [f.label, f.x, f.y, f.size] });
        if (generation !== this.generation) return;
        if (!results.rows.length) {
            widgetApi.setDisplayState('noData');
            return;
        }

        // The preset lacks `suppressFieldDotNotation`, so dotted field keys would read as nested paths.
        const rows = results.rows.map((row): QuadrantDatum => ({
            label: row[f.label.key],
            x: Number(row[f.x.key]),
            y: Number(row[f.y.key]),
            size: Number(row[f.size.key]),
        }));
        const pivot = { x: median(rows.map((r) => r.x)), y: median(rows.map((r) => r.y)) };

        const names = regionNames(f.x.name, f.y.name, format?.style?.regions);
        const studioTheme = getChartTheme(api);

        const options: AgQuadrantChartOptions<QuadrantDatum> = {
            container: this.eGui,
            // The preset accepts no `background`, so transparency has to come from `backgroundColor`.
            theme: {
                ...studioTheme,
                params: { ...studioTheme.params, backgroundColor: 'transparent' },
            },
            data: rows,
            labelKey: 'label',
            xKey: 'x',
            yKey: 'y',
            sizeKey: 'size',
            xName: f.x.name,
            yName: f.y.name,
            sizeName: f.size.name,
            maxSize: 28,
            minSize: 6,
            pivot,
            // The axes cross at the pivot, so titles go at the outer edge to stay clear of it.
            axisPlacement: { title: 'edge', label: 'edge' },
            xAxis: {
                title: { enabled: true, text: `${f.x.name} (median ${abbreviate(pivot.x)})` },
                label: abbreviatedAxisLabel,
            },
            yAxis: {
                title: { enabled: true, text: `${f.y.name} (median ${abbreviate(pivot.y)})` },
                label: abbreviatedAxisLabel,
            },
            regions: {
                // Not 'inside-outer-outer': that pushes labels into the corners, where the
                // series area clips the longer ones.
                label: { position: 'inside-outer-inner' },
                topLeft: region(fill(0), names.topLeft),
                topRight: region(fill(2), names.topRight),
                bottomLeft: region(fill(5), names.bottomLeft),
                bottomRight: region(fill(1), names.bottomRight),
            },
            label: { enabled: false },
            tooltip: {
                renderer: ({ datum }: AgQuadrantTooltipRendererParams<QuadrantDatum, unknown>) =>
                    tooltipContent(String(datum?.label ?? ''), [
                        [f.x.name, abbreviate(datum?.x)],
                        [f.y.name, abbreviate(datum?.y)],
                        [f.size.name, abbreviate(datum?.size)],
                    ]),
            },
        };

        if (this.chart) {
            this.chart.update(options);
        } else {
            this.chart = AgCharts.createQuadrantChart(options);
        }

        this.hasLoaded = true;
        widgetApi.setDisplayState('displayed');
    }
}
