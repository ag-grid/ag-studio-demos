import type { AgDefaultRegistry, AgReportState, AgWidgetState } from 'ag-studio';

// Each embedded viewport is a Studio instance showing one full-canvas widget,
// per the "Embedding Single Widgets" pattern: a one-page report with a single
// widget, sized by the standalone layout (see embeddedAnalyticsDemo.ts).
function singleWidgetState(id: string, widget: AgWidgetState<AgDefaultRegistry>): AgReportState {
    return {
        pages: [
            {
                id: 'page1',
                widgets: { [id]: widget },
                widgetLayout: { [id]: { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 24 } },
            },
        ],
        selectedPageId: 'page1',
    };
}

/** Price chart: monthly average close over the listed history, grouped on the
 *  calendar month fragment (time charts group on a calendar fragment, not the
 *  raw date column). */
export const priceState: AgReportState = singleWidgetState('price', {
    type: 'area-chart',
    dataMapping: {
        categoryKey: [{ id: 'price_history.date::month' }],
        valueKey: [{ id: 'price_history.close', aggregation: 'avg' }],
        tooltipKey: [{ id: 'price_history.volume', aggregation: 'sum' }],
    },
    sort: [{ field: { id: 'price_history.date::month' }, direction: 'asc' }],
    format: {
        title: { enabled: true, text: 'Share Price' },
        subtitle: { enabled: true, text: 'Monthly average close, USD' },
    },
});

/** Revenue/earnings: revenue + EBITDA columns with a net-income line overlay. */
export const financialsState: AgReportState = singleWidgetState('financials', {
    type: 'combo-chart-grouped-column-line',
    dataMapping: {
        categoryKey: [{ id: 'financials.period' }],
        valueKey: [{ id: 'revenue_total' }, { id: 'ebitda_total' }],
        secondaryValueKey: [{ id: 'net_income_total' }],
        tooltipKey: [{ id: 'financials.epsDiluted', aggregation: 'sum' }],
    },
    sort: [{ field: { id: 'financials.period' }, direction: 'asc' }],
    format: {
        title: { enabled: true, text: 'Revenue & Earnings' },
        subtitle: { enabled: true, text: 'Revenue & EBITDA (bars), net income (line)' },
        style: { theme: { common: { legend: { enabled: true, position: 'bottom' } } } },
    },
});

/** Segment mix: latest-year revenue by product line, as a pie. A pie (solid
 *  wedges) shows inside category + value labels legibly in a compact tile, where
 *  a donut ring or outside callouts would be culled for lack of room. */
export const segmentsState: AgReportState = singleWidgetState('segments', {
    type: 'pie-chart',
    dataMapping: {
        categoryKey: [{ id: 'segments.segment' }],
        valueKey: [{ id: 'segments.revenue', aggregation: 'sum' }],
    },
    format: {
        title: { enabled: true, text: 'Revenue by Segment' },
        style: {
            // Category+value inline labels don't fit a compact wedge, so the legend
            // carries the category names and inside labels carry the values.
            theme: { common: { legend: { enabled: true, position: 'bottom' } } },
            custom: { pieDataLabel: { enabled: true, category: false, format: 'value', position: 'inside' } },
        },
    },
});
