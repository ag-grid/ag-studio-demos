import type { AgPageState } from 'ag-studio';

import { EDIT_WARS_SOURCE, EDIT_WARS_TOP_SOURCE, EDIT_WARS_TYPE_SOURCE } from '../data/editWars';
import type { AppRegistry } from '../widgets/registry';
import { span } from './layout';


/**
 * Two helpers rather than one with an optional argument: a conditional spread widens
 * `aggregation` to include `undefined`, which the built-in widget definitions reject.
 */
const dim = (field: string) => [{ id: `${EDIT_WARS_SOURCE}.${field}` }];
const agg = (field: string, aggregation: 'sum' | 'avg' | 'min' | 'max' | 'countd') => [
    { id: `${EDIT_WARS_SOURCE}.${field}`, aggregation },
];
/** The top-15 source, for the charts that rank articles against each other. */
const topDim = (field: string) => [{ id: `${EDIT_WARS_TOP_SOURCE}.${field}` }];
const topAgg = (field: string, aggregation: 'sum' | 'avg') => [{ id: `${EDIT_WARS_TOP_SOURCE}.${field}`, aggregation }];

const typeDim = (field: string) => [{ id: `${EDIT_WARS_TYPE_SOURCE}.${field}` }];
const typeAgg = (field: string, aggregation: 'sum' | 'avg') => [
    { id: `${EDIT_WARS_TYPE_SOURCE}.${field}`, aggregation },
];

const title = (text: string) => ({ title: { enabled: true, text } });
/** KPI tiles label below the number rather than above it. */
const caption = (text: string) => ({ caption: { enabled: true, text } });

/** Axis titles live under `style.custom`, and each needs `enabled` set explicitly. */
const axes = (category: string, value: string) => ({
    style: {
        custom: {
            categoryAxis: { title: { enabled: true, text: category } },
            valueAxis: { title: { enabled: true, text: value } },
        },
    },
});

const pageTitle = {
    type: 'text' as const,
    format: {
        style: {
            text: "Wikipedia's lamest edit wars, then and now",
            // Size rather than weight. A 22px bold on a near-black ground reads as a slab;
            // the same line one step larger and unbolded still leads the page.
            typography: { fontSize: 25 },
        },
    },
    dataMapping: {},
};

const totalEdits = {
    type: 'value' as const,
    format: caption('Total edits today'),
    dataMapping: { value: agg('editsNow', 'sum') },
};

const articlesTracked = {
    type: 'value' as const,
    format: caption('Articles tracked'),
    dataMapping: { value: agg('subject', 'countd') },
};

const editorsInvolved = {
    type: 'value' as const,
    format: caption('Editors involved'),
    dataMapping: { value: agg('editors', 'sum') },
};

/** Reads the edit-ordered source: a radial chart follows data order, so raw rows scatter the petals. */
const editsByType = {
    type: 'nightingale-chart' as const,
    format: {
        ...title('Who edits which disputes'),
        subtitle: {
            enabled: true,
            text: 'Each petal is that type\u2019s total edits, split by whether the editor was signed in',
        },
        style: { theme: { common: { legend: { enabled: true, position: 'bottom' as const } } } },
        // No other widget reads this source, so a selection would only filter this chart.
        crossFilter: 'none' as const,
    },
    dataMapping: {
        categoryKey: typeDim('conflictType'),
        // The nightingale only stacks, so the two measures must be parts of one whole.
        valueKey: [...typeAgg('signedInEdits', 'sum'), ...typeAgg('anonEdits', 'sum')],
    },
};

/** The headline: how far the fifteen most-edited disputes have moved since 2013. */
const thenVsNow = {
    type: 'bar-chart-grouped' as const,
    format: {
        ...title('The fifteen most-edited disputes, 2013 against today'),
        ...axes('Article', 'Total edits'),
        style: {
            ...axes('Article', 'Total edits').style,
            theme: { common: { legend: { enabled: true, position: 'bottom' as const } } },
        },
    },
    dataMapping: {
        categoryKey: topDim('subject'),
        valueKey: [...topAgg('edits2013', 'sum'), ...topAgg('editsNow', 'sum')],
    },
};

/** Median split, so each region holds a meaningful share of the seventy-five articles. */
const disputeQuadrant = {
    type: 'quadrant-chart' as const,
    format: {
        ...title('Few editors or many? Edits against the crowd behind them'),
        subtitle: {
            enabled: true,
            text: 'Each article placed against the median editor count and median edit count',
        },
        style: {
            regions: {
                topLeft: 'Few editors, many edits',
                topRight: 'Mass brawls',
                bottomLeft: 'Quiet corners',
                bottomRight: 'Widely watched, largely settled',
            },
        },
    },
    dataMapping: {
        label: dim('subject'),
        x: agg('editors', 'sum'),
        y: agg('editsNow', 'sum'),
        size: agg('pageviewsMonthly', 'sum'),
    },
};

const disputeTreemap = {
    type: 'treemap-chart' as const,
    format: title('Every dispute, sized by edits'),
    dataMapping: { categoryKey: [...dim('conflictType'), ...dim('subject')], valueKey: agg('editsNow', 'sum') },
};

const editsByCreationYear = {
    type: 'annotated-bar-chart' as const,
    format: title('Edits by the year the page was created'),
    dataMapping: { x: dim('createdYear'), value: agg('editsNow', 'sum') },
};

/** A visible cross-filter control. The ranked bar does not follow: it reads the separate top-15 source. */
const typeFilter = {
    type: 'list-filter' as const,
    format: title('Filter by dispute type'),
    dataMapping: { value: dim('conflictType') },
};

const disputeTable = {
    type: 'grid' as const,
    format: title('The disputes'),
    dataMapping: {
        cols: [
            ...dim('subject'),
            ...dim('conflictType'),
            ...agg('editsNow', 'sum'),
            ...agg('edits2013', 'sum'),
            ...agg('growth', 'avg'),
            ...agg('editors', 'sum'),
            ...dim('detail'),
        ],
    },
};

/** The page, as `initialState` in `index.ts` lists it. */
export const editWarsPage: AgPageState<AppRegistry> = {
    id: 'edit-wars',
    widgets: {
        pageTitle,
        typeFilter,
        totalEdits,
        articlesTracked,
        editorsInvolved,
        disputeQuadrant,
        editsByType,
        thenVsNow,
        disputeTreemap,
        editsByCreationYear,
        disputeTable,
    },
    widgetLayout: {
        pageTitle: span(0, 0, 24, 5),
        totalEdits: span(0, 5, 8, 8),
        articlesTracked: span(8, 5, 8, 8),
        editorsInvolved: span(16, 5, 8, 8),
        // The filter takes a tall narrow column, which suits a list, and the
        // quadrant keeps the rest of the row as the page's focal point.
        typeFilter: span(0, 13, 5, 42),
        disputeQuadrant: span(5, 13, 19, 42),
        editsByType: span(0, 55, 10, 30),
        thenVsNow: span(10, 55, 14, 30),
        disputeTreemap: span(0, 85, 24, 24),
        editsByCreationYear: span(0, 109, 24, 24),
        disputeTable: span(0, 133, 24, 26),
    },
};
