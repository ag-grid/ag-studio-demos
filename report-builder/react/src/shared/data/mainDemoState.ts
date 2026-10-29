import type { AgPageState, AgReportState } from 'ag-studio';

/**
 * Two other surfaces clone these widgets but replace `widgetLayout` with their own, so a widget
 * added or removed here has to be reflected in both: an unlisted widget renders unpositioned, and
 * a removed one leaves a dead layout entry. They are `hero-dashboard/heroDashboardHomepage.ts` and
 * `theme-builder/studioSetup.ts`, which also picks its widgets by an allowlist of ids.
 */
export const executivePage: AgPageState =
    // =====================================================================
    // EXECUTIVE OVERVIEW
    // =====================================================================
    {
        id: 'executive',
        widgets: {
            'page-title-executive': {
                type: 'text',
                dataMapping: {},
                format: {
                    style: {
                        text: 'Executive Overview',
                    },
                },
            },
            // KPI tiles
            'kpi-net-sales': {
                type: 'value',
                dataMapping: { value: [{ id: 'net_sales' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Net Sales',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-order-count': {
                type: 'value',
                dataMapping: { value: [{ id: 'order_count' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Order Count',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-aov': {
                type: 'value',
                dataMapping: { value: [{ id: 'average_order_value' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'AOV',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-gm-percent': {
                type: 'value',
                dataMapping: { value: [{ id: 'gross_margin_percentage' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Gross Margin %',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-on-time-rate': {
                type: 'value',
                dataMapping: { value: [{ id: 'on_time_rate' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'On-time Rate',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-return-rate': {
                type: 'value',
                dataMapping: { value: [{ id: 'return_rate' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Return Rate',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },

            // Line chart: Net Sales by month (click a month -> cross-filter)
            'net-sales-by-month': {
                type: 'line-chart',
                dataMapping: {
                    categoryKey: [{ id: 'orders.order_datetime::month' }],
                    valueKey: [{ id: 'line_net', aggregation: 'sum' }],
                },
                format: { title: { enabled: true, text: 'Net Sales by Month' } },
                sort: [{ field: { id: 'orders.order_datetime::month' }, direction: 'asc' }],
            },

            // Bar charts
            'net-sales-by-region': {
                type: 'bar-chart-stacked',
                dataMapping: {
                    categoryKey: [{ id: 'customers.region' }],
                    // Stack COGS + Margin so the stack height equals Net Sales
                    valueKey: [
                        { id: 'line_cogs', aggregation: 'sum' },
                        { id: 'line_margin', aggregation: 'sum' },
                    ],
                    // Include net sales total in the tooltip
                    tooltipKey: [{ id: 'line_net', aggregation: 'sum' }],
                },
                // Sort by COGS descending
                sort: [{ field: { id: 'line_cogs', aggregation: 'sum' }, direction: 'desc' }],
                format: {
                    title: { enabled: true, text: 'Net Sales by Region' },
                    style: { theme: { common: { legend: { enabled: true, position: 'right' } } } },
                },
            },
            'net-sales-by-subcategory': {
                type: 'bar-chart-stacked',
                dataMapping: {
                    categoryKey: [{ id: 'products.subcategory' }],
                    // Stack COGS + Margin so the stack height equals Net Sales
                    valueKey: [
                        { id: 'line_cogs', aggregation: 'sum' },
                        { id: 'line_margin', aggregation: 'sum' },
                    ],
                    // Include net sales total in the tooltip
                    tooltipKey: [{ id: 'line_net', aggregation: 'sum' }],
                },
                // Sort by COGS descending
                sort: [{ field: { id: 'line_cogs', aggregation: 'sum' }, direction: 'desc' }],
                format: {
                    title: { enabled: true, text: 'Net Sales by Subcategory' },
                    style: { theme: { common: { legend: { enabled: true, position: 'right' } } } },
                },
            },

            // Pivot: the product hierarchy against time, bucketed off the order date column
            'product-mix': {
                type: 'pivot-grid',
                dataMapping: {
                    rows: [{ id: 'products.category' }, { id: 'products.subcategory' }, { id: 'products.brand' }],
                    columns: [{ id: 'orders.order_datetime::year' }],
                    values: [
                        { id: 'line_net', aggregation: 'sum' },
                        { id: 'line_margin', aggregation: 'sum' },
                    ],
                },
                format: {
                    title: { enabled: true, text: 'Product Mix by Year' },
                    style: { totalColumns: true, grandTotalRow: { enabled: true } },
                },
            },
        },
        widgetLayout: {
            'page-title-executive': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 4 },
            'kpi-net-sales': { xTrack: 0, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-order-count': { xTrack: 8, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-aov': { xTrack: 16, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-gm-percent': { xTrack: 0, yTrack: 10, xSpan: 8, ySpan: 6 },
            'kpi-on-time-rate': { xTrack: 8, yTrack: 10, xSpan: 8, ySpan: 6 },
            'kpi-return-rate': { xTrack: 16, yTrack: 10, xSpan: 8, ySpan: 6 },

            'net-sales-by-month': { xTrack: 0, yTrack: 16, xSpan: 24, ySpan: 16 },
            'net-sales-by-region': { xTrack: 0, yTrack: 32, xSpan: 12, ySpan: 16 },
            'net-sales-by-subcategory': { xTrack: 12, yTrack: 32, xSpan: 12, ySpan: 16 },
            'product-mix': { xTrack: 0, yTrack: 48, xSpan: 24, ySpan: 20 },
        },
        filter: {
            page: [
                {
                    field: {
                        id: 'calendar::year',
                    },
                    view: {
                        expanded: false,
                    },
                    model: {
                        operator: 'greaterThanOrEqual',
                        value: 2024,
                    },
                },
            ],
        },
    };

export const salesPerformancePage: AgPageState =
    // =====================================================================
    // SALES & MARGIN PERFORMANCE
    // =====================================================================
    {
        id: 'sales-margin',
        widgets: {
            'page-title-sales-margin': {
                type: 'text',
                dataMapping: {},
                format: {
                    style: {
                        text: 'Sales & Margin Performance',
                    },
                },
            },
            // Line/area: Net Sales and Gross Margin % by month. `order_month` is a date-typed
            // month, so the category axis is a time axis and months are spaced by date.
            'sales-and-margin-over-time': {
                type: 'area-chart',
                dataMapping: {
                    categoryKey: [{ id: 'order_month' }],
                    valueKey: [{ id: 'line_net', aggregation: 'sum' }],
                    tooltipKey: [{ id: 'gross_margin_pct' }],
                },
                format: { title: { enabled: true, text: 'Net Sales and Gross Margin % by Month' } },
                sort: [{ field: { id: 'order_month' }, direction: 'asc' }],
            },

            // Stacked bar: Net Sales by Subcategory, one series per channel
            'sales-by-subcategory-and-channel': {
                type: 'bar-chart-stacked',
                dataMapping: {
                    categoryKey: [{ id: 'products.subcategory' }],
                    valueKey: [{ id: 'line_net', aggregation: 'sum' }],
                    legendKey: [{ id: 'orders.channel' }],
                    tooltipKey: [{ id: 'line_margin', aggregation: 'sum' }],
                },
                sort: [{ field: { id: 'line_net', aggregation: 'sum' }, direction: 'desc' }],
                format: {
                    title: { enabled: true, text: 'Net Sales by Subcategory and Channel' },
                    style: { theme: { common: { legend: { enabled: true, position: 'bottom' } } } },
                },
            },

            // Scatter: Quantity vs Discount % (size by Net Sales)
            'qty-vs-discount': {
                type: 'bubble-chart',
                dataMapping: {
                    groupByKey: [{ id: 'products.brand' }],
                    categoryKey: [{ id: 'order_items.quantity', aggregation: 'avg' }],
                    valueKey: [{ id: 'order_items.discount_pct', aggregation: 'avg' }],
                    sizeKey: [{ id: 'line_net', aggregation: 'sum' }],
                    legendKey: [{ id: 'products.category' }],
                    tooltipKey: [{ id: 'line_net', aggregation: 'sum' }],
                },
                format: {
                    title: { enabled: true, text: 'Quantity vs Discount (size by Net Sales)' },
                    style: { theme: { common: { legend: { enabled: true, position: 'bottom' } } } },
                },
            },

            // Table: Top Products
            'top-products': {
                type: 'grid',
                dataMapping: {
                    cols: [
                        { id: 'products.product_name' },
                        { id: 'line_net', aggregation: 'sum' },
                        { id: 'order_items.quantity', aggregation: 'sum' },
                        { id: 'gross_margin_percentage' },
                        { id: 'return_rate' },
                    ],
                },
                sort: [{ field: { id: 'line_net', aggregation: 'sum' }, direction: 'desc' }],
                format: { title: { enabled: true, text: 'Top Products' } },
            },

            // Button filter: Filter by Region
            'region-filter': {
                type: 'button-filter',
                dataMapping: {
                    value: [{ id: 'customers.region' }],
                },
            },
        },
        widgetLayout: {
            'page-title-sales-margin': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 4 },
            'region-filter': { xTrack: 0, yTrack: 4, xSpan: 24, ySpan: 7 },
            'sales-and-margin-over-time': { xTrack: 0, yTrack: 11, xSpan: 24, ySpan: 16 },
            'sales-by-subcategory-and-channel': { xTrack: 0, yTrack: 27, xSpan: 12, ySpan: 18 },
            'qty-vs-discount': { xTrack: 12, yTrack: 27, xSpan: 12, ySpan: 18 },
            'top-products': { xTrack: 0, yTrack: 45, xSpan: 24, ySpan: 19 },
        },
        filter: {
            page: [
                {
                    field: {
                        id: 'calendar::year',
                    },
                    view: {
                        expanded: false,
                    },
                    model: {
                        operator: 'greaterThanOrEqual',
                        value: 2024,
                    },
                },
            ],
        },
    };

export const fulfilmentPage: AgPageState =
    // =====================================================================
    // FULFILMENT & DELIVERY HEALTH
    // =====================================================================
    {
        id: 'fulfilment',
        widgets: {
            'page-title-fulfilment': {
                type: 'text',
                dataMapping: {},
                format: {
                    style: {
                        text: 'Fulfilment & Delivery Health',
                    },
                },
            },
            // KPI tiles
            'kpi-orders-shipped': {
                type: 'value',
                dataMapping: { value: [{ id: 'shipped_orders' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Orders Shipped',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-orders-delivered': {
                type: 'value',
                dataMapping: { value: [{ id: 'delivered_orders' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Orders Delivered',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-avg-transit-days': {
                type: 'value',
                dataMapping: { value: [{ id: 'avg_ship_to_delivery_days' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Avg Ship to Delivery Days',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },

            // Gauges: both rates share a 0-100% scale so their dials are directly comparable
            'gauge-on-time-rate': {
                type: 'radial-gauge',
                dataMapping: { value: [{ id: 'on_time_rate' }] },
                format: {
                    title: { enabled: true, text: 'On-time Rate' },
                    style: {
                        label: { enabled: true },
                        secondaryLabel: { enabled: true, text: 'of delivered orders' },
                        scaleLabel: { enabled: true, min: 0, max: 1 },
                    },
                },
            },
            'gauge-delay-rate': {
                type: 'radial-gauge',
                dataMapping: { value: [{ id: 'delay_rate' }] },
                format: {
                    title: { enabled: true, text: 'Delay Rate' },
                    style: {
                        label: { enabled: true },
                        secondaryLabel: { enabled: true, text: 'of delivered orders' },
                        scaleLabel: { enabled: true, min: 0, max: 1 },
                    },
                },
            },
            // Delivery status breakdown
            'delivery-status': {
                type: 'pie-chart',
                dataMapping: {
                    categoryKey: [{ id: 'delivery_status' }],
                    valueKey: [{ id: 'shipments.shipment_id', aggregation: 'count' }],
                    tooltipKey: [],
                },
                format: {
                    title: { enabled: true, text: 'Delivery Status' },
                    style: {
                        theme: {
                            common: {
                                legend: {
                                    enabled: true,
                                    position: 'right',
                                },
                            },
                        },
                    },
                },
            },

            // Bar: Delay Rate by Carrier
            'delay-rate-by-carrier': {
                type: 'bar-chart-grouped',
                dataMapping: {
                    categoryKey: [{ id: 'shipments.carrier' }],
                    valueKey: [{ id: 'delay_rate' }],
                },
                sort: [{ field: { id: 'delay_rate' }, direction: 'desc' }],
                format: { title: { enabled: true, text: 'Delay Rate by Carrier' } },
            },

            // Table: Worst lanes
            'worst-lanes': {
                type: 'grid',
                dataMapping: {
                    cols: [
                        { id: 'customers.region' },
                        { id: 'shipments.carrier' },
                        { id: 'shipments.shipment_id', aggregation: 'count' },
                        { id: 'on_time_rate' },
                        { id: 'avg_ship_to_delivery_days' },
                    ],
                },
                sort: [{ field: { id: 'on_time_rate' }, direction: 'asc' }],
                format: { title: { enabled: true, text: 'Worst Lanes' } },
            },
        },
        widgetLayout: {
            'page-title-fulfilment': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 4 },
            'kpi-orders-shipped': { xTrack: 0, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-orders-delivered': { xTrack: 8, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-avg-transit-days': { xTrack: 16, yTrack: 4, xSpan: 8, ySpan: 6 },

            'gauge-on-time-rate': { xTrack: 0, yTrack: 10, xSpan: 12, ySpan: 16 },
            'gauge-delay-rate': { xTrack: 12, yTrack: 10, xSpan: 12, ySpan: 16 },

            'delivery-status': { xTrack: 0, yTrack: 26, xSpan: 12, ySpan: 16 },
            'delay-rate-by-carrier': { xTrack: 12, yTrack: 26, xSpan: 12, ySpan: 16 },
            'worst-lanes': { xTrack: 0, yTrack: 42, xSpan: 24, ySpan: 22 },
        },
        filter: {
            page: [
                {
                    field: {
                        id: 'calendar::year',
                    },
                    view: {
                        expanded: false,
                    },
                    model: {
                        operator: 'greaterThanOrEqual',
                        value: 2024,
                    },
                },
            ],
        },
    };

export const returnsPage: AgPageState =
    // =====================================================================
    // RETURNS & QUALITY SIGNALS
    // =====================================================================
    {
        id: 'returns',
        widgets: {
            'page-title-returns': {
                type: 'text',
                dataMapping: {},
                format: {
                    style: {
                        text: 'Returns & Quality Signals',
                    },
                },
            },
            'kpi-return-rate': {
                type: 'value',
                dataMapping: { value: [{ id: 'return_rate' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Return Rate (Lines)',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-return-value': {
                type: 'value',
                dataMapping: { value: [{ id: 'return_value' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Return Value',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'kpi-return-margin-impact': {
                type: 'value',
                dataMapping: { value: [{ id: 'return_margin_impact' }] },
                format: {
                    style: {
                        label: {
                            enabled: true,
                            text: 'Return Margin Impact',
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 20,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                        },
                    },
                },
            },
            'cumulative-return-value-by-month': {
                type: 'column-chart-grouped',
                dataMapping: {
                    // Group on the conformed calendar dimension (not the bound `return_costs.period::year`)
                    // so a year selection cross-filters every bound source through its own binding -
                    // e.g. the Return Reasons donut conforms via the orders binding (order year).
                    categoryKey: [{ id: 'calendar::year' }],
                    valueKey: [
                        { id: 'return_refunds', aggregation: 'sum' },
                        { id: 'return_shipping', aggregation: 'sum' },
                        { id: 'return_write_offs', aggregation: 'sum' },
                    ],
                },
                format: {
                    title: { enabled: true, text: 'Return Costs by Year' },
                    style: { theme: { common: { legend: { enabled: true, position: 'right' } } } },
                },
                sort: [{ field: { id: 'calendar::year' }, direction: 'asc' }],
            },
            'return-rate-by-subcategory': {
                type: 'bar-chart-stacked',
                dataMapping: {
                    categoryKey: [{ id: 'products.subcategory' }],
                    valueKey: [
                        { id: 'return_refunds', aggregation: 'sum' },
                        { id: 'return_shipping', aggregation: 'sum' },
                        { id: 'return_write_offs', aggregation: 'sum' },
                    ],
                },
                format: {
                    title: { enabled: true, text: 'Returns by Subcategory' },
                    style: { theme: { common: { legend: { enabled: true, position: 'right' } } } },
                },
            },
            'return-reasons': {
                type: 'donut-chart',
                dataMapping: {
                    categoryKey: [{ id: 'order_items.return_reason' }],
                    valueKey: [{ id: 'order_items.order_item_id', aggregation: 'count' }],
                },
                format: {
                    title: { enabled: true, text: 'Return Reasons' },
                    style: {
                        theme: {
                            common: { legend: { enabled: true, position: 'right' } },
                        },
                        custom: {
                            pieDataLabel: { enabled: true },
                        },
                    },
                },
            },
            'problem-products': {
                type: 'grid',
                dataMapping: {
                    cols: [
                        { id: 'products.product_name' },
                        { id: 'returned_lines' },
                        { id: 'return_rate' },
                        { id: 'line_net', aggregation: 'sum' },
                        { id: 'gross_margin_percentage' },
                    ],
                },
                sort: [{ field: { id: 'returned_lines' }, direction: 'desc' }],
                format: { title: { enabled: true, text: 'Problem Products' } },
            },
        },
        widgetLayout: {
            'page-title-returns': { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 4 },
            'kpi-return-rate': { xTrack: 0, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-return-value': { xTrack: 8, yTrack: 4, xSpan: 8, ySpan: 6 },
            'kpi-return-margin-impact': { xTrack: 16, yTrack: 4, xSpan: 8, ySpan: 6 },
            'cumulative-return-value-by-month': { xTrack: 0, yTrack: 10, xSpan: 24, ySpan: 16 },
            'return-rate-by-subcategory': { xTrack: 0, yTrack: 26, xSpan: 12, ySpan: 16 },
            'return-reasons': { xTrack: 12, yTrack: 26, xSpan: 12, ySpan: 16 },
            'problem-products': { xTrack: 0, yTrack: 42, xSpan: 24, ySpan: 22 },
        },
        filter: {
            page: [
                {
                    field: { id: 'calendar::year' },
                    view: { expanded: false },
                    model: { operator: 'greaterThanOrEqual', value: 2024 },
                },
            ],
            widget: {
                'return-reasons': [
                    {
                        field: { id: 'order_items.returned' },
                        view: { expanded: true },
                        model: { operator: 'isTrue' },
                    },
                ],
                'problem-products': [],
            },
        },
    };

export const mainDemoState: AgReportState = {
    pages: [executivePage, salesPerformancePage, fulfilmentPage, returnsPage],
    selectedPageId: 'executive',
};
