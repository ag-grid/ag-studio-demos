import type {
    AgDataMappingDefinition,
    AgDataMappingItem,
    AgPath,
    AgWidgetData,
    AgWidgetDataFormat,
    AgWidgetFormParams,
    AgWidgetFormTabGroup,
} from 'ag-studio';
import { createWidgets } from 'ag-studio';

import { AnnotationsWidget, ErrorBarsWidget } from './cartesianWidgets';
import { ChoroplethWidget } from './choroplethWidget';
import {
    annotatedBarIcon,
    choroplethIcon,
    errorBarsIcon,
    organizationIcon,
    quadrantIcon,
    routeMapIcon,
    sankeyIcon,
    worldMapIcon,
} from './icons';
import { RouteMapWidget, WorldMapWidget } from './mapWidgets';
import { OrganizationWidget } from './organizationWidget';
import { QuadrantWidget } from './quadrantWidget';
import { SankeyWidget } from './sankeyWidget';
import type {
    AnnotationsDef,
    AppRegistry,
    ErrorBarsDef,
    OrganizationDef,
    QuadrantDef,
    RouteMapDef,
    SankeyDef,
    WorldMapDef,
} from './types';

export type { AppRegistry };

// Factories rather than shared constants, so each widget definition gets its own object
// and no two of them can end up aliasing the same mapping spec.
const category = (): AgDataMappingDefinition<string> => ({
    type: 'field',
    supportedRoles: ['category'],
    required: true,
});
const numeric = (): AgDataMappingDefinition<string> => ({ type: 'field', supportedRoles: ['numeric'], required: true });
const axis = (): AgDataMappingDefinition<string> => ({
    type: 'field',
    supportedRoles: ['category', 'temporal'],
    required: true,
});

/**
 * The default form always has a cross-filter section, but these widgets emit no selections, so
 * it is dropped by key; `supportsCrossHighlight` only toggles options inside it.
 */
const formWithoutCrossFilter =
    <TDef extends AgWidgetData<unknown, AgWidgetDataFormat<unknown>>>(
        dataMappingItems: AgDataMappingItem<TDef['dataMapping']>[]
    ) =>
    (params: AgWidgetFormParams<TDef>): AgWidgetFormTabGroup<AgPath<TDef>> => {
        const form = params.createDefaults({ dataMappingItems });
        const crossFilterKey = params.createCrossFilterSection().key;
        for (const tab of form.items) {
            tab.items = tab.items.filter((item) => item.type !== 'section' || item.key !== crossFilterKey);
        }
        return form;
    };

/**
 * The quadrant's region names. Studio rebuilds `format` from the form, so a `style` key with no
 * control behind it would be dropped from `initialState`.
 */
const quadrantForm = (params: AgWidgetFormParams<QuadrantDef>): AgWidgetFormTabGroup<AgPath<QuadrantDef>> => {
    const form = formWithoutCrossFilter<QuadrantDef>([
        { key: 'label', label: 'Label' },
        { key: 'x', label: 'X value' },
        { key: 'y', label: 'Y value' },
        { key: 'size', label: 'Size' },
    ])(params);
    const titleKey = params.createTitleSection().key;
    const formatTab = form.items.find((tab) =>
        tab.items.some((item) => item.type === 'section' && item.key === titleKey)
    );
    formatTab?.items.push({
        type: 'section',
        key: 'quadrantRegions',
        // Not "Regions": that is already the choropleth's label in the widget menu.
        label: 'Region labels',
        defaultExpanded: false,
        items: [
            { type: 'textfield', id: 'format.style.regions.topLeft', label: 'Top left' },
            { type: 'textfield', id: 'format.style.regions.topRight', label: 'Top right' },
            { type: 'textfield', id: 'format.style.regions.bottomLeft', label: 'Bottom left' },
            { type: 'textfield', id: 'format.style.regions.bottomRight', label: 'Bottom right' },
        ],
    });
    return form;
};

export const widgets = createWidgets<AppRegistry>({
    additionalTypes: [
        {
            id: 'organization-chart',
            label: 'Org',
            icon: organizationIcon,
            dataMapping: { id: category(), parentId: category(), title: category(), subtitle: category() },
            form: formWithoutCrossFilter<OrganizationDef>([
                { key: 'id', label: 'Node ID' },
                { key: 'parentId', label: 'Parent ID' },
                { key: 'title', label: 'Title' },
                { key: 'subtitle', label: 'Subtitle' },
            ]),
            comp: OrganizationWidget,
            defaultSize: { width: 700, height: 460 },
            minSize: { width: 300, height: 240 },
        },
        {
            id: 'world-map-chart',
            label: 'World',
            icon: worldMapIcon,
            dataMapping: { region: category(), value: numeric(), latitude: numeric(), longitude: numeric() },
            form: formWithoutCrossFilter<WorldMapDef>([
                { key: 'region', label: 'Region' },
                { key: 'value', label: 'Value' },
                { key: 'latitude', label: 'Latitude' },
                { key: 'longitude', label: 'Longitude' },
            ]),
            comp: WorldMapWidget,
            defaultSize: { width: 700, height: 440 },
            minSize: { width: 320, height: 240 },
        },
        {
            id: 'route-map-chart',
            label: 'Routes',
            icon: routeMapIcon,
            dataMapping: { route: category(), value: numeric() },
            form: formWithoutCrossFilter<RouteMapDef>([
                { key: 'route', label: 'Route' },
                { key: 'value', label: 'Value' },
            ]),
            comp: RouteMapWidget,
            defaultSize: { width: 700, height: 420 },
            minSize: { width: 320, height: 240 },
        },
        {
            id: 'error-bars-chart',
            label: 'Spread',
            icon: errorBarsIcon,
            dataMapping: { x: axis(), mean: numeric(), lower: numeric(), upper: numeric() },
            form: formWithoutCrossFilter<ErrorBarsDef>([
                { key: 'x', label: 'Category' },
                { key: 'mean', label: 'Mean' },
                { key: 'lower', label: 'Lower' },
                { key: 'upper', label: 'Upper' },
            ]),
            comp: ErrorBarsWidget,
            defaultSize: { width: 560, height: 400 },
            minSize: { width: 260, height: 220 },
        },
        {
            id: 'annotated-bar-chart',
            label: 'Callouts',
            icon: annotatedBarIcon,
            dataMapping: { x: axis(), value: numeric() },
            form: formWithoutCrossFilter<AnnotationsDef>([
                { key: 'x', label: 'Category' },
                { key: 'value', label: 'Value' },
            ]),
            comp: AnnotationsWidget,
            defaultSize: { width: 620, height: 400 },
            minSize: { width: 280, height: 220 },
        },
        {
            id: 'choropleth-chart',
            label: 'Regions',
            icon: choroplethIcon,
            dataMapping: { county: category(), value: numeric() },
            form: (params) =>
                params.createDefaults({
                    dataMappingItems: [
                        { key: 'county', label: 'County' },
                        { key: 'value', label: 'Value' },
                    ],
                }),
            comp: ChoroplethWidget,
            defaultSize: { width: 560, height: 520 },
            minSize: { width: 280, height: 300 },
        },
        {
            id: 'quadrant-chart',
            label: 'Quadrant',
            icon: quadrantIcon,
            dataMapping: { label: category(), x: numeric(), y: numeric(), size: numeric() },
            form: quadrantForm,
            comp: QuadrantWidget,
            defaultSize: { width: 640, height: 460 },
            minSize: { width: 320, height: 280 },
        },
        {
            id: 'sankey-chart',
            label: 'Sankey',
            icon: sankeyIcon,
            dataMapping: { sources: category(), targets: category(), value: numeric() },
            form: formWithoutCrossFilter<SankeyDef>([
                { key: 'sources', label: 'From' },
                { key: 'targets', label: 'To' },
                { key: 'value', label: 'Value' },
            ]),
            comp: SankeyWidget,
            defaultSize: { width: 600, height: 400 },
            minSize: { width: 300, height: 200 },
        },
    ],
    menu: [
        {
            label: 'Custom Widget',
            widgetIds: [
                'organization-chart',
                'world-map-chart',
                'route-map-chart',
                'choropleth-chart',
                'sankey-chart',
                'quadrant-chart',
                'error-bars-chart',
                'annotated-bar-chart',
            ],
        },
        {
            label: 'widgetPanelWidgetCategoryColumnChart',
            widgetIds: ['column-chart-grouped', 'column-chart-stacked', 'column-chart-stacked-100'],
        },
        {
            label: 'widgetPanelWidgetCategoryBarChart',
            widgetIds: ['bar-chart-grouped', 'bar-chart-stacked', 'bar-chart-stacked-100'],
        },
        { label: 'widgetPanelWidgetCategoryLineChart', widgetIds: ['line-chart'] },
        {
            label: 'widgetPanelWidgetCategoryAreaChart',
            widgetIds: ['area-chart', 'area-chart-stacked', 'area-chart-stacked-100'],
        },
        { label: 'widgetPanelWidgetCategoryKpi', widgetIds: ['value', 'radial-gauge', 'linear-gauge'] },
        { label: 'widgetPanelWidgetCategoryScatterChart', widgetIds: ['scatter-chart', 'bubble-chart'] },
        { label: 'widgetPanelWidgetCategoryTable', widgetIds: ['grid', 'pivot-grid'] },
        {
            label: 'widgetPanelWidgetCategoryPolarChart',
            widgetIds: [
                'radar-line-chart',
                'radar-area-chart',
                'radial-column-chart',
                'nightingale-chart',
                'radial-bar-chart',
            ],
        },
        { label: 'widgetPanelWidgetCategoryProportionalChart', widgetIds: ['pie-chart', 'donut-chart'] },
        {
            label: 'widgetPanelWidgetCategoryProgressionChart',
            widgetIds: ['funnel-chart', 'cone-funnel-chart', 'pyramid-chart'],
        },
        { label: 'widgetPanelWidgetCategoryHierarchyChart', widgetIds: ['treemap-chart', 'sunburst-chart'] },
        { label: 'widgetPanelWidgetCategoryStaticContent', widgetIds: ['text', 'image'] },
        { label: 'widgetPanelWidgetCategoryFilter', widgetIds: ['button-filter', 'list-filter', 'date-filter'] },
        {
            label: 'widgetPanelWidgetCategoryCombo',
            widgetIds: ['combo-chart-grouped-column-line', 'combo-chart-stacked-column-line'],
        },
    ],
});
