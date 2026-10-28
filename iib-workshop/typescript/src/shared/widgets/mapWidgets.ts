import type {
    AgChartOptions,
    AgMapLineSeriesTooltipRendererParams,
    AgMapMarkerSeriesTooltipRendererParams,
    AgMapShapeSeriesTooltipRendererParams,
} from 'ag-charts-enterprise';
import type { AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';

import type { routeTopology } from '../data/routes';
import type { countryTopology } from '../data/worldTopology';
import { IIB } from '../theme';
import { ChartWidgetBase } from './chartWidgetBase';
import { tooltipContent } from './tooltip';
import type { DataRow, RouteMapDef, WorldMapDef } from './types';

// Loaded on first use: the world outline is the largest module in the app, and only the
// pages with a map need it. The type-only imports above keep both modules out of the bundle
// until then.
const loadCountries = (): Promise<typeof countryTopology> =>
    import('../data/worldTopology').then((m) => m.countryTopology);
const loadRoutes = (): Promise<typeof routeTopology> => import('../data/routes').then((m) => m.routeTopology);

interface WorldFields {
    region: AgWidgetField;
    value: AgWidgetField;
    latitude: AgWidgetField;
    longitude: AgWidgetField;
}

/** Choropleth plus proportional bubbles, driven by one query. */
export class WorldMapWidget extends ChartWidgetBase<WorldMapDef, WorldFields> {
    protected resolveFields(m: AgWidgetDataMapping<WorldMapDef>): WorldFields | null {
        const region = m.region?.[0];
        const value = m.value?.[0];
        const latitude = m.latitude?.[0];
        const longitude = m.longitude?.[0];
        return region && value && latitude && longitude ? { region, value, latitude, longitude } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<WorldMapDef>,
        f: WorldFields
    ): Promise<AgChartOptions | null> {
        const [{ results }, countries] = await Promise.all([
            widgetApi.getData({ fields: [f.region, f.value, f.latitude, f.longitude] }),
            loadCountries(),
        ]);
        if (!results.rows.length) {
            return null;
        }

        return {
            data: results.rows,
            topology: countries,
            series: [
                // Every country, so the ones without data read as unmeasured rather than
                // missing. The choropleth above only covers the thirteen that carry a value.
                { type: 'map-shape-background', fill: IIB.raised, stroke: IIB.border },
                {
                    type: 'map-shape',
                    topologyIdKey: 'name',
                    idKey: f.region.key,
                    colorKey: f.value.key,
                    tooltip: {
                        renderer: ({ datum }: AgMapShapeSeriesTooltipRendererParams<DataRow>) =>
                            tooltipContent(String(datum?.[f.region.key] ?? ''), [
                                [f.value.name, widgetApi.formatFieldValue(f.value, datum?.[f.value.key])],
                            ]),
                    },
                },
                // Positioned from the data's own coordinates rather than the topology, so
                // these need no topologyIdKey of their own.
                {
                    type: 'map-marker',
                    latitudeKey: f.latitude.key,
                    longitudeKey: f.longitude.key,
                    sizeKey: f.value.key,
                    labelKey: f.region.key,
                    // A floor keeps the smallest territories from shrinking to a few pixels,
                    // where they read as missing rather than small.
                    minSize: 9,
                    maxSize: 34,
                    stroke: IIB.canvas,
                    strokeWidth: 1,
                    tooltip: {
                        renderer: ({ datum }: AgMapMarkerSeriesTooltipRendererParams<DataRow>) =>
                            tooltipContent(String(datum?.[f.region.key] ?? ''), [
                                [f.value.name, widgetApi.formatFieldValue(f.value, datum?.[f.value.key])],
                            ]),
                    },
                },
            ],
            suppressFieldDotNotation: true,
        };
    }
}

interface RouteFields {
    route: AgWidgetField;
    value: AgWidgetField;
}

/** Lanes over unbound background geography, stroke width scaled by the measure. */
export class RouteMapWidget extends ChartWidgetBase<RouteMapDef, RouteFields> {
    protected resolveFields(m: AgWidgetDataMapping<RouteMapDef>): RouteFields | null {
        const route = m.route?.[0];
        const value = m.value?.[0];
        return route && value ? { route, value } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<RouteMapDef>,
        f: RouteFields
    ): Promise<AgChartOptions | null> {
        const [{ results }, countries, routes] = await Promise.all([
            widgetApi.getData({ fields: [f.route, f.value] }),
            loadCountries(),
            loadRoutes(),
        ]);
        if (!results.rows.length) {
            return null;
        }

        return {
            data: results.rows,
            series: [
                // Carries no data, so it needs no keys: it exists to give the routes some
                // geography to sit on.
                { type: 'map-shape-background', topology: countries, fill: IIB.raised, stroke: IIB.border },
                {
                    type: 'map-line',
                    topology: routes,
                    topologyIdKey: 'name',
                    idKey: f.route.key,
                    sizeKey: f.value.key,
                    labelKey: f.route.key,
                    maxStrokeWidth: 9,
                    tooltip: {
                        renderer: ({ datum }: AgMapLineSeriesTooltipRendererParams<DataRow>) =>
                            tooltipContent(String(datum?.[f.route.key] ?? ''), [
                                [f.value.name, widgetApi.formatFieldValue(f.value, datum?.[f.value.key])],
                            ]),
                    },
                },
            ],
            suppressFieldDotNotation: true,
        };
    }
}
