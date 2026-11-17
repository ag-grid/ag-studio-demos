import type { AgChartInstance, AgChartOptions } from 'ag-charts-enterprise';
import { AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';
import type {
    AgBaseRegistry,
    AgBaseWidgetDefinition,
    AgDefaultWidgetDefinition,
    AgPath,
    AgTypeScriptComponent,
    AgWidgetDataFormat,
    AgWidgetFieldReference,
    AgWidgetFormParams,
    AgWidgetFormTabGroup,
    AgWidgetParams,
} from 'ag-studio';
import { getChartTheme } from 'ag-studio';

ModuleRegistry.registerModules([AllEnterpriseModule]);

export interface HeatmapDef {
    type: 'heatmap-chart';
    dataMapping: Record<'x' | 'y' | 'color', AgWidgetFieldReference[]>;
    format?: AgWidgetDataFormat<unknown>;
}

export interface ServiceHealthRegistry extends AgBaseRegistry {
    widgets: readonly (AgDefaultWidgetDefinition | AgBaseWidgetDefinition<'heatmap-chart', HeatmapDef>)[];
}

/**
 * A heatmap of one value over two categories, drawn with AG Charts. Each cell shows its formatted
 * value in the tooltip, and the colour scale follows the value's range.
 */
class HeatmapWidget implements AgTypeScriptComponent<AgWidgetParams<HeatmapDef>> {
    private readonly eGui = document.createElement('div');
    private chart: AgChartInstance | null = null;
    private hasLoaded = false;
    private generation = 0;

    init(params: AgWidgetParams<HeatmapDef>): Promise<void> {
        this.eGui.style.cssText = 'width: 100%; height: 100%;';
        return this.refresh(params);
    }

    refresh(params: AgWidgetParams<HeatmapDef>): Promise<void> {
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

    private async load({ api, widgetApi, dataMapping }: AgWidgetParams<HeatmapDef>): Promise<void> {
        const generation = ++this.generation;
        const x = dataMapping.x?.[0];
        const y = dataMapping.y?.[0];
        const color = dataMapping.color?.[0];
        if (!x || !y || !color) {
            widgetApi.setDisplayState('incompleteDataMapping');
            return;
        }

        widgetApi.setDisplayState('loading', { prominent: !this.hasLoaded });
        const { results } = await widgetApi.getData({
            fields: [x, y, color],
            sort: [
                { field: x, direction: 'asc' },
                { field: y, direction: 'asc' },
            ],
        });
        // A refresh may have superseded this one while the query was in flight.
        if (generation !== this.generation) {
            return;
        }
        if (!results.rows.length) {
            widgetApi.setDisplayState('noData');
            return;
        }

        const data = results.rows.map((row) => ({
            x: widgetApi.formatFieldValue(x, row[x.key]),
            y: widgetApi.formatFieldValue(y, row[y.key]),
            color: row[color.key],
        }));

        const options: AgChartOptions = {
            container: this.eGui,
            data,
            theme: getChartTheme(api),
            // The widget wrapper already paints the surface.
            background: { fill: 'transparent' },
            series: [
                {
                    type: 'heatmap',
                    xKey: 'x',
                    xName: widgetApi.getFieldName(x),
                    yKey: 'y',
                    yName: widgetApi.getFieldName(y),
                    colorKey: 'color',
                    colorName: widgetApi.getFieldName(color),
                    // Cool to hot, in Carbon's Blue 60, Yellow 30 and Red 60, legible in either mode.
                    colorScale: { fills: [{ color: '#0F62FE' }, { color: '#F1C21B' }, { color: '#DA1E28' }] },
                    tooltip: {
                        renderer: ({ datum }) => ({
                            title: `${datum.y}, ${datum.x}`,
                            data: [
                                {
                                    label: widgetApi.getFieldName(color),
                                    value: widgetApi.formatFieldValue(color, datum.color),
                                },
                            ],
                        }),
                    },
                },
            ],
        };

        if (this.chart) {
            this.chart.update(options);
        } else {
            this.chart = AgCharts.create(options);
        }

        this.hasLoaded = true;
        widgetApi.setDisplayState('displayed');
    }
}

/** The heatmap does not start a cross filter, so its form leaves out the cross filter section. */
function heatmapForm(params: AgWidgetFormParams<HeatmapDef>): AgWidgetFormTabGroup<AgPath<HeatmapDef>> {
    const form = params.createDefaults({
        dataMappingItems: [
            { key: 'x', label: 'X Axis' },
            { key: 'y', label: 'Y Axis' },
            { key: 'color', label: 'Colour' },
        ],
    });
    const crossFilterKey = params.createCrossFilterSection().key;
    for (const tab of form.items) {
        tab.items = tab.items.filter((item) => item.type !== 'section' || item.key !== crossFilterKey);
    }
    return form;
}

/** A grid of cells in the theme's first chart colour, at the strengths a heatmap shades by. */
const HEATMAP_ICON = [
    '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="var(--ag-chart-palette-fills-1-color, #5090DC)">',
    '<path fill-opacity=".3" d="M0 5h7v7h-7zM0 21h7v7h-7zM8 21h7v7h-7z"/>',
    '<path fill-opacity=".55" d="M8 5h7v7h-7zM0 13h7v7h-7zM16 21h7v7h-7z"/>',
    '<path fill-opacity=".8" d="M16 5h7v7h-7zM8 13h7v7h-7zM24 13h7v7h-7zM24 21h7v7h-7z"/>',
    '<path fill-opacity="1" d="M24 5h7v7h-7zM16 13h7v7h-7z"/>',
    '</svg>',
].join('');

/**
 * The heatmap's widget type. A TypeScript component works in every framework, so each variant
 * passes this to its own `createWidgets`.
 */
export const heatmapWidget: AgBaseWidgetDefinition<'heatmap-chart', HeatmapDef> = {
    id: 'heatmap-chart',
    label: 'Heatmap',
    icon: HEATMAP_ICON,
    dataMapping: {
        x: { type: 'field', supportedRoles: ['category', 'temporal'], required: true },
        y: { type: 'field', supportedRoles: ['category', 'temporal'], required: true },
        color: { type: 'field', supportedRoles: ['numeric'], required: true },
    },
    form: heatmapForm,
    comp: HeatmapWidget,
    defaultSize: { width: 600, height: 400 },
    minSize: { width: 300, height: 200 },
};
