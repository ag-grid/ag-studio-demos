import type { AgFilterState, AgPageState, AgReportState, AgValueWidget } from 'ag-studio';

import { executivePage, fulfilmentPage, mainDemoState, salesPerformancePage } from './data/mainDemoState';

/**
 * The Report Builder's own Executive Overview, in place of the plainer one the rest of the site
 * shares: headline KPIs with a monthly sparkline each, then a trend, channel and regional splits, and
 * a category table. The other reports are the shared ones, except that every pie here shows its
 * labels and the shared Executive Overview's product pivot moves to Sales & Margin.
 */

const SINCE_2024: AgFilterState = {
    field: { id: 'calendar::year' },
    view: { expanded: false },
    model: { operator: 'greaterThanOrEqual', value: 2024 },
};

function kpiWithTrend(valueId: string): AgValueWidget {
    return {
        type: 'value',
        dataMapping: {
            value: [{ id: valueId }],
            sparklineX: [{ id: 'calendar::month' }],
        },
        format: {
            style: { label: { enabled: true }, sparkline: { lineWidth: 2 } },
        },
    };
}

/** Also the homepage hero's dashboard, so it is laid out to fit the hero's frame without scrolling. */
export const executiveOverviewPage: AgPageState = {
    id: executivePage.id,
    widgets: {
        'page-title-executive': {
            type: 'text',
            dataMapping: {},
            format: {
                widget: { borderEnabled: false, backgroundColor: 'transparent' },
                style: {
                    text: 'Executive Overview',
                    textAlign: 'left',
                    verticalAlign: 'center',
                    typography: { fontSize: 22, fontWeight: 'bold' },
                },
            },
        },

        'kpi-net-sales': kpiWithTrend('net_sales'),
        'kpi-gross-margin': kpiWithTrend('gross_margin_percentage'),
        'kpi-order-count': kpiWithTrend('order_count'),
        'kpi-on-time-rate': kpiWithTrend('on_time_rate'),

        'net-sales-by-month': {
            type: 'combo-chart-grouped-column-line',
            dataMapping: {
                categoryKey: [{ id: 'orders.order_datetime::month' }],
                valueKey: [{ id: 'net_sales' }],
                secondaryValueKey: [{ id: 'order_count' }],
            },
            sort: [{ field: { id: 'orders.order_datetime::month' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Net Sales and Orders' },
                subtitle: { enabled: true, text: 'By month, after discounts' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'right' } },
                        line: { series: { marker: { enabled: false }, interpolation: { type: 'smooth' } } },
                    },
                },
            },
        },
        'sales-by-channel': {
            type: 'donut-chart',
            dataMapping: {
                categoryKey: [{ id: 'orders.channel' }],
                valueKey: [{ id: 'net_sales' }],
            },
            sort: [{ field: { id: 'net_sales' }, direction: 'desc' }],
            format: {
                title: { enabled: true, text: 'Sales by Channel' },
                subtitle: { enabled: true, text: 'Share of net sales' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'right' } } },
                    custom: {
                        pieDataLabel: { enabled: true, format: 'percent', position: 'outside' },
                        totalLabel: { enabled: true },
                    },
                },
            },
        },

        'net-sales-by-region': {
            type: 'bar-chart-stacked',
            dataMapping: {
                categoryKey: [{ id: 'customers.region' }],
                // COGS and margin stack to net sales, which the tooltip adds.
                valueKey: [{ id: 'COGS' }, { id: 'gross_margin' }],
                tooltipKey: [{ id: 'net_sales' }],
            },
            sort: [{ field: { id: 'COGS' }, direction: 'desc' }],
            format: {
                title: { enabled: true, text: 'Net Sales by Region' },
                subtitle: { enabled: true, text: 'Cost of goods and margin' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'right' } },
                        // Thick enough for each segment's label to sit inside it.
                        bar: { series: { width: 22, label: { enabled: true } } },
                    },
                },
            },
        },
        'category-performance': {
            type: 'grid',
            dataMapping: {
                cols: [
                    { id: 'products.category' },
                    { id: 'net_sales' },
                    { id: 'order_count' },
                    { id: 'gross_margin_percentage' },
                ],
            },
            sort: [{ field: { id: 'net_sales' }, direction: 'desc' }],
            format: {
                title: { enabled: true, text: 'Category Performance' },
                subtitle: { enabled: true, text: 'Net sales, orders and margin' },
                style: { headerRow: { wrapText: true } },
            },
        },
    },
    widgetLayout: {
        'page-title-executive': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 4 },

        'kpi-net-sales': { xTrack: 0, yTrack: 4, xSpan: 6, ySpan: 9 },
        'kpi-gross-margin': { xTrack: 6, yTrack: 4, xSpan: 6, ySpan: 9 },
        'kpi-order-count': { xTrack: 12, yTrack: 4, xSpan: 6, ySpan: 9 },
        'kpi-on-time-rate': { xTrack: 18, yTrack: 4, xSpan: 6, ySpan: 9 },

        'net-sales-by-month': { xTrack: 0, yTrack: 13, xSpan: 16, ySpan: 17 },
        'sales-by-channel': { xTrack: 16, yTrack: 13, xSpan: 8, ySpan: 17 },

        'net-sales-by-region': { xTrack: 0, yTrack: 30, xSpan: 12, ySpan: 18 },
        'category-performance': { xTrack: 12, yTrack: 30, xSpan: 12, ySpan: 18 },
    },
    filter: {
        page: [SINCE_2024],
    },
};

const labelledFulfilmentPage: AgPageState = {
    ...fulfilmentPage,
    widgets: {
        ...fulfilmentPage.widgets,
        'delivery-status': {
            type: 'pie-chart',
            dataMapping: {
                categoryKey: [{ id: 'delivery_status' }],
                valueKey: [{ id: 'shipments.shipment_id', aggregation: 'count' }],
            },
            format: {
                title: { enabled: true, text: 'Delivery Status' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'right' } } },
                    custom: { pieDataLabel: { enabled: true, format: 'percent', position: 'outside' } },
                },
            },
        },
    },
};

const { widgets: executiveWidgets = {} } = executivePage;

const salesWithProductMixPage: AgPageState = {
    ...salesPerformancePage,
    widgets: { ...salesPerformancePage.widgets, 'product-mix': executiveWidgets['product-mix'] },
    widgetLayout: {
        ...salesPerformancePage.widgetLayout,
        'product-mix': { xTrack: 0, yTrack: 64, xSpan: 24, ySpan: 20 },
    },
};

const REPORT_BUILDER_PAGES: Record<string, AgPageState> = {
    [executiveOverviewPage.id]: executiveOverviewPage,
    [salesWithProductMixPage.id]: salesWithProductMixPage,
    [labelledFulfilmentPage.id]: labelledFulfilmentPage,
};

export const reportBuilderState: AgReportState = {
    ...mainDemoState,
    pages: mainDemoState.pages.map((page) => REPORT_BUILDER_PAGES[page.id] ?? page),
};
