import type {
    AgBaseRegistry,
    AgBaseWidgetDefinition,
    AgDefaultWidgetDefinition,
    AgWidgetDataFormat,
    AgWidgetFieldReference,
} from 'ag-studio';

type Mapping<K extends string> = Record<K, AgWidgetFieldReference[]>;

/** One row of a widget query result, keyed by each field's `key`, as a chart receives it. */
export type DataRow = Record<string, unknown>;

export interface OrganizationDef {
    type: 'organization-chart';
    dataMapping: Mapping<'id' | 'parentId' | 'title' | 'subtitle'>;
}
export interface WorldMapDef {
    type: 'world-map-chart';
    dataMapping: Mapping<'region' | 'value' | 'latitude' | 'longitude'>;
}
export interface RouteMapDef {
    type: 'route-map-chart';
    dataMapping: Mapping<'route' | 'value'>;
}
export interface ErrorBarsDef {
    type: 'error-bars-chart';
    dataMapping: Mapping<'x' | 'mean' | 'lower' | 'upper'>;
}
export interface AnnotationsDef {
    type: 'annotated-bar-chart';
    dataMapping: Mapping<'x' | 'value'>;
}
export interface ChoroplethDef {
    type: 'choropleth-chart';
    dataMapping: Mapping<'county' | 'value'>;
}
export interface QuadrantRegionNames {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
}
export interface QuadrantStyle {
    /**
     * Names for the four regions. Naming them is what turns a scatter into an argument, but
     * the names belong to the report, not to the widget: the same quadrant on two pages over
     * two datasets needs two sets. Left unset, each region is labelled from the mapped x and
     * y field names.
     */
    regions?: QuadrantRegionNames;
}
export interface QuadrantDef {
    type: 'quadrant-chart';
    dataMapping: Mapping<'label' | 'x' | 'y' | 'size'>;
    format?: AgWidgetDataFormat<QuadrantStyle>;
}
export interface SankeyDef {
    type: 'sankey-chart';
    dataMapping: Mapping<'sources' | 'targets' | 'value'>;
}

export interface AppRegistry extends AgBaseRegistry {
    widgets: readonly (
        | AgDefaultWidgetDefinition
        | AgBaseWidgetDefinition<'organization-chart', OrganizationDef>
        | AgBaseWidgetDefinition<'world-map-chart', WorldMapDef>
        | AgBaseWidgetDefinition<'route-map-chart', RouteMapDef>
        | AgBaseWidgetDefinition<'error-bars-chart', ErrorBarsDef>
        | AgBaseWidgetDefinition<'annotated-bar-chart', AnnotationsDef>
        | AgBaseWidgetDefinition<'choropleth-chart', ChoroplethDef>
        | AgBaseWidgetDefinition<'sankey-chart', SankeyDef>
        | AgBaseWidgetDefinition<'quadrant-chart', QuadrantDef>
    )[];
}
