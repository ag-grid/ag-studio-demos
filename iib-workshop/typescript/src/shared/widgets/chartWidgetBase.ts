import type { AgChartInstance, AgChartOptions } from 'ag-charts-enterprise';
import { AgCharts } from 'ag-charts-enterprise';
import type {
    AgTypeScriptComponent,
    AgWidgetData,
    AgWidgetDataFormat,
    AgWidgetDataMapping,
    AgWidgetParams,
} from 'ag-studio';
import { getChartTheme } from 'ag-studio';

import './chartModules';

/** Lifecycle, display state and theming for a widget that renders one AG Charts instance. */
export abstract class ChartWidgetBase<
    TDef extends AgWidgetData<unknown, AgWidgetDataFormat<unknown>>,
    TFields,
> implements AgTypeScriptComponent<AgWidgetParams<TDef>> {
    private readonly eGui = document.createElement('div');
    private chart: AgChartInstance | null = null;
    private hasLoaded = false;
    private generation = 0;

    /** Return the fields this widget needs from the resolved mapping, or null when it is incomplete. */
    protected abstract resolveFields(dataMapping: AgWidgetDataMapping<TDef>): TFields | null;

    /** Build the chart options, or return null to show the empty state. */
    protected abstract buildOptions(
        params: AgWidgetParams<TDef>,
        fields: TFields
    ): Promise<AgChartOptions | null> | AgChartOptions | null;

    init(params: AgWidgetParams<TDef>): Promise<void> {
        this.eGui.style.cssText = 'width: 100%; height: 100%;';
        return this.refresh(params);
    }

    refresh(params: AgWidgetParams<TDef>): Promise<void> {
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

    private async load(params: AgWidgetParams<TDef>): Promise<void> {
        const generation = ++this.generation;
        const { api, widgetApi, dataMapping } = params;

        const fields = this.resolveFields(dataMapping);
        if (!fields) {
            widgetApi.setDisplayState('incompleteDataMapping');
            return;
        }

        widgetApi.setDisplayState('loading', { prominent: !this.hasLoaded });

        const options = await this.buildOptions(params, fields);
        // A refresh may have superseded this one while the query was in flight.
        if (generation !== this.generation) {
            return;
        }
        if (!options) {
            widgetApi.setDisplayState('noData');
            return;
        }

        // A theme given by name has no overrides to merge, so only an object is carried over.
        const widgetTheme = typeof options.theme === 'object' ? options.theme : undefined;
        const themed: AgChartOptions = {
            ...options,
            container: this.eGui,
            // Merged rather than replaced: some options (annotation styles) are only settable via a theme.
            theme: { ...getChartTheme(api), ...widgetTheme },
            // The widget wrapper already paints the surface; an opaque chart background
            // would draw a second, slightly different panel on top of it.
            background: { fill: 'transparent' },
        };

        if (this.chart) {
            this.chart.update(themed);
        } else {
            this.chart = AgCharts.create(themed);
        }

        this.hasLoaded = true;
        widgetApi.setDisplayState('displayed');
    }
}
