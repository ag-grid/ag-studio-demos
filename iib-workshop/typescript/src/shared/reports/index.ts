import type { AgReportState } from 'ag-studio';

import { SOURCE } from '../data/sources';
import type { AppRegistry } from '../widgets/registry';
import { BUILT_IN_ORDER, BUILT_IN_WIDGETS } from './builtIns';
import { editWarsPage } from './editWars';
import { healthPage, healthSchema } from './health';
import { span } from './layout';

export interface ReportMeta {
    id: string;
    name: string;
}

/**
 * Names for the pages the starter ships. The sidebar lists pages in state order; this only
 * names them.
 */
export const REPORTS: ReportMeta[] = [
    { id: 'my-report', name: 'My report' },
    { id: 'gallery', name: 'Widget Gallery' },
    { id: 'edit-wars', name: 'Wikipedia Edit Wars' },
    { id: 'health', name: 'Live Long & Prosper' },
];

const org = {
    type: 'organization-chart' as const,
    dataMapping: {
        id: [{ id: `${SOURCE.org}.employeeId` }],
        parentId: [{ id: `${SOURCE.org}.managerId` }],
        title: [{ id: `${SOURCE.org}.name` }],
        subtitle: [{ id: `${SOURCE.org}.title` }],
    },
};

/**
 * The gallery's own quadrant. The Edit Wars config has one too, but it reads the Wikipedia
 * tables; this one reads `portfolio`, so every widget on the gallery page draws on a table
 * that exists only for the gallery.
 */
const portfolioQuadrant = {
    type: 'quadrant-chart' as const,
    dataMapping: {
        label: [{ id: `${SOURCE.portfolio}.product` }],
        x: [{ id: `${SOURCE.portfolio}.revenue`, aggregation: 'sum' as const }],
        y: [{ id: `${SOURCE.portfolio}.growth`, aggregation: 'avg' as const }],
        size: [{ id: `${SOURCE.portfolio}.customers`, aggregation: 'sum' as const }],
    },
};

const sankey = {
    type: 'sankey-chart' as const,
    dataMapping: {
        sources: [{ id: `${SOURCE.sales}.region` }],
        targets: [{ id: `${SOURCE.sales}.quarter` }],
        value: [{ id: `${SOURCE.sales}.revenue`, aggregation: 'sum' as const }],
    },
};

const errorBars = {
    type: 'error-bars-chart' as const,
    dataMapping: {
        x: [{ id: `${SOURCE.readings}.machine` }],
        // Three aggregations over one source field. There is no standard-deviation
        // aggregation, so the whiskers are the observed min and max.
        mean: [{ id: `${SOURCE.readings}.cycleSeconds`, aggregation: 'avg' as const }],
        lower: [{ id: `${SOURCE.readings}.cycleSeconds`, aggregation: 'min' as const }],
        upper: [{ id: `${SOURCE.readings}.cycleSeconds`, aggregation: 'max' as const }],
    },
};

const annotated = {
    type: 'annotated-bar-chart' as const,
    dataMapping: {
        x: [{ id: `${SOURCE.monthly}.month` }],
        value: [{ id: `${SOURCE.monthly}.revenue`, aggregation: 'sum' as const }],
    },
};

const worldMap = {
    type: 'world-map-chart' as const,
    dataMapping: {
        region: [{ id: `${SOURCE.territories}.country` }],
        value: [{ id: `${SOURCE.territories}.revenue`, aggregation: 'sum' as const }],
        // Coordinates are attributes of the country, not quantities to total up.
        latitude: [{ id: `${SOURCE.territories}.latitude`, aggregation: 'avg' as const }],
        longitude: [{ id: `${SOURCE.territories}.longitude`, aggregation: 'avg' as const }],
    },
};

const routeMap = {
    type: 'route-map-chart' as const,
    dataMapping: {
        route: [{ id: `${SOURCE.freight}.route` }],
        value: [{ id: `${SOURCE.freight}.teu`, aggregation: 'sum' as const }],
    },
};

const choropleth = {
    type: 'choropleth-chart' as const,
    dataMapping: {
        county: [{ id: `${SOURCE.stores}.county` }],
        value: [{ id: `${SOURCE.stores}.revenue`, aggregation: 'sum' as const }],
    },
};

/** Titles a gallery copy of a widget definition, leaving the original untitled for the reports. */
const card = <T extends object>(widget: T, name: string, series: string) => ({
    ...widget,
    format: {
        ...(widget as { format?: object }).format,
        title: { enabled: true, text: name },
        subtitle: { enabled: true, text: series },
    },
});

const heading = (text: string) => ({
    type: 'text' as const,
    format: { style: { text, typography: { fontSize: 15, fontWeight: 'bold' as const } } },
    dataMapping: {},
});

const customHeading = heading(
    'Custom widgets - eight that AG Studio does not ship, each about fifty lines in src/shared/widgets/'
);
const builtInHeading = heading(`Built-in widgets - the ${BUILT_IN_ORDER.length} AG Studio ships`);

/** The gallery leads with the built-in widgets; the custom ones start on the track below them. */
const CUSTOM_TOP = 6 + Math.ceil(BUILT_IN_ORDER.length / 3) * 20;

/**
 * The canvas is 24 tracks wide. Row height is ~15px, so a 22-track-tall widget is roughly
 * 330px: enough for a chart to keep its axis labels.
 */
export const initialState: AgReportState<AppRegistry> = {
    panels: { filters: { collapsed: true }, edit: { collapsed: true }, data: { collapsed: true } },
    selectedPageId: 'my-report',
    // The health page's calculated columns and measure.
    schema: healthSchema,
    pages: [
        // Where participants start: an empty page to build on.
        { id: 'my-report', widgets: {}, widgetLayout: {} },
        {
            id: 'gallery',
            widgets: {
                builtInHeading,
                ...BUILT_IN_WIDGETS,
                customHeading,
                quadrant: card(
                    portfolioQuadrant,
                    'Quadrant',
                    'AgCharts.createQuadrantChart, a preset rather than a series'
                ),
                worldMap: card(worldMap, 'World Map', 'map-shape, map-shape-background and map-marker'),
                org: card(org, 'Organization Chart', 'organization'),
                sankey: card(sankey, 'Sankey Diagram', 'sankey'),
                routeMap: card(routeMap, 'Route Map', 'map-line over map-shape-background'),
                choropleth: card(choropleth, 'UK Choropleth', 'map-shape, shaded by value'),
                errorBars: card(errorBars, 'Error Bars', 'bar with errorBar'),
                annotated: card(annotated, 'Annotated Bars', 'bar with chart annotations'),
            },
            widgetLayout: {
                builtInHeading: span(0, 0, 24, 4),
                // Three to a row. Thirty-six tiles written out would be thirty-six chances
                // to mistype a track number, and the grid is the same every time.
                ...Object.fromEntries(
                    BUILT_IN_ORDER.map((key, i) => [key, span((i % 3) * 8, 5 + Math.floor(i / 3) * 20, 8, 20)])
                ),
                customHeading: span(0, CUSTOM_TOP, 24, 4),
                quadrant: span(0, CUSTOM_TOP + 4, 24, 26),
                worldMap: span(0, CUSTOM_TOP + 30, 24, 26),
                org: span(0, CUSTOM_TOP + 56, 14, 24),
                sankey: span(14, CUSTOM_TOP + 56, 10, 24),
                routeMap: span(0, CUSTOM_TOP + 80, 14, 24),
                choropleth: span(14, CUSTOM_TOP + 80, 10, 24),
                errorBars: span(0, CUSTOM_TOP + 104, 12, 22),
                annotated: span(12, CUSTOM_TOP + 104, 12, 22),
            },
        },
        // The two finished examples: one over the A (Wikipedia) tables, one over the B
        // (longevity) tables with its own calculated columns.
        editWarsPage,
        healthPage,
    ],
};
