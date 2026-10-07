import type {
    AgCalendar,
    AgDataSourcesDefinition,
    AgExpressionFieldDefinition,
    AgFieldDefinition,
    AgRelationDefinition,
} from 'ag-studio';

import type { DemoData, DictColumn, EncodedTable } from './demoDataGenerator';
import { encodeDemoData, generateDemoData, getDictVal } from './demoDataGenerator';

// Internal duck-typed shape - the engine reads `nullMasks` / `statsHints`
// at the internal boundary even though the public response is just `{ data }`.
interface ColumnStatsHint {
    nullCount?: number;
    indexToValue?: string[];
}
interface ColumnsResponse {
    data: ArrayLike<unknown>[];
    nullMasks: Array<Uint8Array | null>;
    statsHints: Array<ColumnStatsHint | null>;
}

// =============================================================================
// Field Definitions
// =============================================================================

export const storesFields: AgFieldDefinition[] = [
    {
        id: 'store_id',
        name: 'Store ID',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
    { id: 'store_name', name: 'Store', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'region', name: 'Region', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'city', name: 'City', format: 'textFormat', cardinality: 'low', notBlank: true },
    {
        id: 'opened_date',
        name: 'Opened Date',
        format: 'dateFormat',
        cardinality: 'medium',
        notBlank: true,
    },
    { id: 'store_type', name: 'Store Type', format: 'textFormat', cardinality: 'low', notBlank: true },
];

export const productsFields: AgFieldDefinition[] = [
    {
        id: 'product_id',
        name: 'Product ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
        hide: false,
    },
    {
        id: 'product_name',
        name: 'Product',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    { id: 'category', name: 'Category', format: 'textFormat', cardinality: 'low', notBlank: true },
    {
        id: 'subcategory',
        name: 'Subcategory',
        format: 'textFormat',
        cardinality: 'medium',
        notBlank: true,
    },
    { id: 'brand', name: 'Brand', format: 'textFormat', cardinality: 'medium', notBlank: true },
    { id: 'launch_date', name: 'Launch Date', format: 'dateFormat', cardinality: 'high', notBlank: true },
    {
        id: 'list_price',
        name: 'List Price',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: {
            format: '£#,##0.00',
        },
    },
    {
        id: 'unit_cost',
        name: 'Unit Cost',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: {
            format: '£#,##0.00',
        },
    },
    {
        id: 'is_discontinued',
        name: 'Discontinued',
        format: 'booleanFormat',
        cardinality: 'low',
        notBlank: true,
    },
];

export const customersFields: AgFieldDefinition[] = [
    {
        id: 'customer_id',
        name: 'Customer ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
        hide: false,
    },
    {
        id: 'customer_name',
        name: 'Customer',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    { id: 'signup_date', name: 'Signup Date', format: 'dateFormat', cardinality: 'high', notBlank: true },
    { id: 'region', name: 'Region', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'segment', name: 'Segment', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'is_active', name: 'Active', format: 'booleanFormat', cardinality: 'low', notBlank: true },
    {
        id: 'marketing_opt_in',
        name: 'Marketing Opt-in',
        format: 'booleanFormat',
        cardinality: 'low',
        notBlank: true,
    },
];

export const ordersFields: AgFieldDefinition[] = [
    {
        id: 'order_id',
        name: 'Order ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
        hide: false,
    },
    {
        id: 'customer_id',
        name: 'Customer ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'store_id',
        name: 'Store ID',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
    {
        id: 'order_datetime',
        name: 'Order Date/Time',
        format: 'dateTimeFormat',
        cardinality: 'high',
        notBlank: true,
    },
    { id: 'channel', name: 'Channel', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'status', name: 'Status', format: 'textFormat', cardinality: 'low', notBlank: true },
    {
        id: 'payment_method',
        name: 'Payment Method',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
    {
        id: 'currency',
        name: 'Currency',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
        hide: false,
    },
    {
        id: 'promo_code',
        name: 'Promo Code',
        format: 'textFormat',
        cardinality: 'medium',
        notBlank: false,
        hide: false,
    },
    { id: 'notes', name: 'Notes', format: 'textFormat', cardinality: 'high', notBlank: false, hide: false },
];

export const orderItemsFields: AgFieldDefinition[] = [
    {
        id: 'order_item_id',
        name: 'Order Item ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'order_id',
        name: 'Order ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'product_id',
        name: 'Product ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'quantity',
        name: 'Qty',
        format: 'integerFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0' },
    },
    {
        id: 'unit_price',
        name: 'Unit Price',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: {
            format: '£#,##0.00',
        },
    },
    {
        id: 'discount_pct',
        name: 'Discount',
        format: 'percentageFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'tax_rate',
        name: 'Tax Rate',
        format: 'percentageFormat',
        cardinality: 'low',
        notBlank: true,
        formatOptions: { format: '#,##0%' },
    },
    { id: 'returned', name: 'Returned', format: 'booleanFormat', cardinality: 'low', notBlank: true },
    {
        id: 'return_reason',
        name: 'Return Reason',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: false,
    },
];

export const shipmentsFields: AgFieldDefinition[] = [
    {
        id: 'shipment_id',
        name: 'Shipment ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'order_id',
        name: 'Order ID',
        format: 'textFormat',
        cardinality: 'high',
        notBlank: true,
    },
    {
        id: 'ship_datetime',
        name: 'Shipped Date/Time',
        format: 'dateTimeFormat',
        cardinality: 'high',
        notBlank: false,
    },
    {
        id: 'delivery_datetime',
        name: 'Delivered Date/Time',
        format: 'dateTimeFormat',
        cardinality: 'high',
        notBlank: false,
    },
    { id: 'carrier', name: 'Carrier', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'delayed', name: 'Delayed', format: 'booleanFormat', cardinality: 'low', notBlank: false },
];

const subcategoriesFields: AgFieldDefinition[] = [
    {
        id: 'subcategory',
        name: 'Subcategory',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
];

const returnCostsFields: AgFieldDefinition[] = [
    {
        id: 'period',
        name: 'Period',
        format: 'dateFormat',
        cardinality: 'medium',
        notBlank: true,
    },
    {
        id: 'subcategory',
        name: 'Subcategory',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
    {
        id: 'return_reason',
        name: 'Return Reason',
        format: 'textFormat',
        cardinality: 'low',
        notBlank: true,
    },
    {
        id: 'refunds',
        name: 'Refunds',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '£#,##0.0,K' },
    },
    {
        id: 'shipping',
        name: 'Shipping',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '£#,##0.0,K' },
    },
    {
        id: 'write_offs',
        name: 'Write-offs',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '£#,##0.0,K' },
    },
];

// =============================================================================
// JSON Loading & Per-Source Caches
// =============================================================================

async function loadJson(baseUrl: string, filename: string): Promise<any[]> {
    const url = `${baseUrl}/${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Failed to load ${filename}: ${response.status}`);
        return [];
    }
    const data = await response.json();
    return data;
}

// =============================================================================
// Cached Loaders
// =============================================================================

// Each loader caches its promise so the file is fetched and parsed at most once.

let storesCache: Promise<any[]> | null = null;
const getStores = (baseUrl: string) => (storesCache ??= loadJson(baseUrl, 'stores.json'));

let productsCache: Promise<any[]> | null = null;
const getProducts = (baseUrl: string) => (productsCache ??= loadJson(baseUrl, 'products.json'));

let customersCache: Promise<any[]> | null = null;
const getCustomers = (baseUrl: string) => (customersCache ??= loadJson(baseUrl, 'customers.json'));

let ordersCache: Promise<any[]> | null = null;
const getOrders = (baseUrl: string) => (ordersCache ??= loadJson(baseUrl, 'orders.json'));

let orderItemsCache: Promise<any[]> | null = null;
const getOrderItems = (baseUrl: string) => (orderItemsCache ??= loadJson(baseUrl, 'order_items.json'));

let shipmentsCache: Promise<any[]> | null = null;
const getShipments = (baseUrl: string) => (shipmentsCache ??= loadJson(baseUrl, 'shipments.json'));

// =============================================================================
// Expressions (Calculated Columns & Measures)
// =============================================================================

export const expressions: AgExpressionFieldDefinition[] = [
    // -------------------------------------------------------------------------
    // Pre-aggregation expressions (row-level calculations on order_items)
    // -------------------------------------------------------------------------

    // line_gross = quantity * unit_price
    {
        id: 'line_gross',
        isMeasure: false,
        name: 'Line Gross',
        hide: false,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'order_items.quantity' }, { id: 'order_items.unit_price' }],
        },
    },

    // line_discount_amount = line_gross * discount_pct
    {
        id: 'line_discount_amount',
        isMeasure: false,
        name: 'Discount Amount',
        hide: false,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'line_gross' }, { id: 'order_items.discount_pct' }],
        },
    },

    // line_net = line_gross - line_discount_amount
    {
        id: 'line_net',
        isMeasure: false,
        name: 'Line Net',
        hide: false,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'subtract',
            inputs: [{ id: 'line_gross' }, { id: 'line_discount_amount' }],
        },
    },

    // line_cogs = quantity * unit_cost (from products via join)
    {
        id: 'line_cogs',
        isMeasure: false,
        name: 'Line COGS',
        hide: false,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'order_items.quantity' }, { id: 'products.unit_cost' }],
        },
    },

    // line_margin = line_net - line_cogs
    {
        id: 'line_margin',
        isMeasure: false,
        name: 'Line Margin',
        hide: false,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'subtract',
            inputs: [{ id: 'line_net' }, { id: 'line_cogs' }],
        },
    },

    // return_flag = returned IS TRUE (for filtering/counting)
    {
        id: 'return_flag',
        isMeasure: false,
        name: 'Return Flag',
        hide: true,
        expression: {
            operator: 'isTrue',
            inputs: [{ id: 'order_items.returned' }],
        },
    },

    // returned_line_flag = IF(return_flag, 1, 0) - numeric flag for summing
    {
        id: 'returned_line_flag',
        isMeasure: false,
        name: 'Returned Line Flag',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'return_flag' }, { type: 'number', value: 1 }, { type: 'number', value: 0 }],
        },
    },

    // returned_line_net = IF(return_flag, line_net, 0) - line net only for returned items
    {
        id: 'returned_line_net',
        isMeasure: false,
        name: 'Returned Line Net',
        hide: true,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'if',
            inputs: [{ id: 'return_flag' }, { id: 'line_net' }, { type: 'number', value: 0 }],
        },
    },

    // returned_line_margin = IF(return_flag, line_margin, 0) - margin only for returned items
    {
        id: 'returned_line_margin',
        isMeasure: false,
        name: 'Returned Line Margin',
        hide: true,
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
        expression: {
            operator: 'if',
            inputs: [{ id: 'return_flag' }, { id: 'line_margin' }, { type: 'number', value: 0 }],
        },
    },

    // returned_line_cogs = IF(return_flag, line_cogs, 0)
    {
        id: 'returned_line_cogs',
        isMeasure: false,
        name: 'Returned Line COGS',
        hide: true,
        format: 'currencyFormat',
        formatOptions: { format: '£#,##0.00' },
        expression: {
            operator: 'if',
            inputs: [{ id: 'return_flag' }, { id: 'line_cogs' }, { type: 'number', value: 0 }],
        },
    },

    // return_refunds = returned_line_net * 0.45
    {
        id: 'return_refunds',
        isMeasure: false,
        name: 'Refunds',
        hide: true,
        format: 'currencyFormat',
        formatOptions: { format: '£#,##0.0,K' },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'returned_line_net' }, { type: 'number', value: 0.45 }],
        },
    },

    // return_shipping = returned_line_margin * 0.65
    {
        id: 'return_shipping',
        isMeasure: false,
        name: 'Shipping',
        hide: true,
        format: 'currencyFormat',
        formatOptions: { format: '£#,##0.0,K' },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'returned_line_margin' }, { type: 'number', value: 0.65 }],
        },
    },

    // return_write_offs = returned_line_cogs * 0.35
    {
        id: 'return_write_offs',
        isMeasure: false,
        name: 'Write-offs',
        hide: true,
        format: 'currencyFormat',
        formatOptions: { format: '£#,##0.0,K' },
        expression: {
            operator: 'multiply',
            inputs: [{ id: 'returned_line_cogs' }, { type: 'number', value: 0.35 }],
        },
    },

    // -------------------------------------------------------------------------
    // Post-aggregation expressions (measures for KPIs)
    // For now, use pre-agg expressions with aggregation in widgets directly
    // -------------------------------------------------------------------------

    // Gross Margin % = (SUM(line_net) - SUM(line_cogs)) / SUM(line_net)
    {
        id: 'gross_margin_pct',
        isMeasure: true,
        name: 'Gross Margin %',
        hide: false,
        expression: {
            operator: 'divide',
            inputs: [
                {
                    operator: 'subtract',
                    inputs: [
                        { id: 'line_net', aggregation: 'sum' },
                        { id: 'line_cogs', aggregation: 'sum' },
                    ],
                },
                { id: 'line_net', aggregation: 'sum' },
            ],
        },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },

    // order_month = DATETRUNC(month, order_datetime)
    // Date-typed, so a chart grouping on it gets a time axis - a `::month` bucket is a
    // packed integer and only ever yields a discrete category axis.
    {
        id: 'order_month',
        isMeasure: false,
        name: 'Order Month',
        format: 'dateTimeFormat',
        formatOptions: { format: 'mmm yyyy' },
        expression: {
            operator: 'dateTrunc',
            inputs: [{ type: 'string', value: 'month' }, { id: 'orders.order_datetime' }],
        },
    },

    // order_status_group = IF(status = "Processing", "Open", "Closed")
    {
        id: 'order_status_group',
        isMeasure: false,
        name: 'Status Group',
        expression: {
            operator: 'if',
            inputs: [
                { operator: 'equals', inputs: [{ id: 'orders.status' }, { type: 'string', value: 'Processing' }] },
                { type: 'string', value: 'Open' },
                { type: 'string', value: 'Closed' },
            ],
        },
    },

    // is_closed = status IN ("Completed", "Returned", "Cancelled") via chained OR
    {
        id: 'is_closed',
        isMeasure: false,
        name: 'Is Closed',
        expression: {
            operator: 'or',
            inputs: [
                { operator: 'equals', inputs: [{ id: 'orders.status' }, { type: 'string', value: 'Completed' }] },
                {
                    operator: 'or',
                    inputs: [
                        {
                            operator: 'equals',
                            inputs: [{ id: 'orders.status' }, { type: 'string', value: 'Returned' }],
                        },
                        {
                            operator: 'equals',
                            inputs: [{ id: 'orders.status' }, { type: 'string', value: 'Cancelled' }],
                        },
                    ],
                },
            ],
        },
    },

    // ship_to_delivery_days = DATEDIFF(day, ship_datetime, delivery_datetime)
    {
        id: 'ship_to_delivery_days',
        isMeasure: false,
        name: 'Ship to Delivery Days',
        expression: {
            operator: 'datediff',
            inputs: [
                { type: 'string', value: 'day' },
                { id: 'shipments.ship_datetime' },
                { id: 'shipments.delivery_datetime' },
            ],
        },
    },

    // order_to_ship_hours = DATEDIFF(hour, order_datetime, ship_datetime)
    {
        id: 'order_to_ship_hours',
        isMeasure: false,
        name: 'Order to Ship Hours',
        expression: {
            operator: 'datediff',
            inputs: [
                { type: 'string', value: 'hour' },
                { id: 'orders.order_datetime' },
                { id: 'shipments.ship_datetime' },
            ],
        },
    },

    // is_shipped = ship_datetime IS NOT NULL
    {
        id: 'is_shipped',
        isMeasure: false,
        name: 'Is Shipped',
        hide: true,
        expression: {
            operator: 'isNotNull',
            inputs: [{ id: 'shipments.ship_datetime' }],
        },
    },

    // is_delivered = delivery_datetime IS NOT NULL
    {
        id: 'is_delivered',
        isMeasure: false,
        name: 'Is Delivered',
        hide: true,
        expression: {
            operator: 'isNotNull',
            inputs: [{ id: 'shipments.delivery_datetime' }],
        },
    },

    // is_on_time = IF(is_delivered, delayed = FALSE, FALSE)
    // Use IF+EQUALS to guarantee a boolean result.
    {
        id: 'is_on_time',
        isMeasure: false,
        name: 'Is On Time',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [
                { id: 'is_delivered' },
                { operator: 'equals', inputs: [{ id: 'shipments.delayed' }, { type: 'boolean', value: false }] },
                { type: 'boolean', value: false },
            ],
        },
    },

    // is_delayed = IF(is_delivered, delayed = TRUE, FALSE)
    // Use IF+EQUALS to guarantee a boolean result.
    {
        id: 'is_delayed',
        isMeasure: false,
        name: 'Is Delayed',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [
                { id: 'is_delivered' },
                { operator: 'equals', inputs: [{ id: 'shipments.delayed' }, { type: 'boolean', value: true }] },
                { type: 'boolean', value: false },
            ],
        },
    },

    // delayed_shipments = IF(is_delayed, 1, 0) - numeric flag for stacking
    {
        id: 'delayed_shipments',
        isMeasure: false,
        name: 'Delayed Shipments',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_delayed' }, { type: 'number', value: 1 }, { type: 'number', value: 0 }],
        },
    },

    // on_time_shipments = IF(is_on_time, 1, 0) - numeric flag for stacking
    {
        id: 'on_time_shipments',
        isMeasure: false,
        name: 'On-time Shipments',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_on_time' }, { type: 'number', value: 1 }, { type: 'number', value: 0 }],
        },
    },

    // delivered_shipments = IF(is_delivered, 1, 0) - numeric flag for rate denominators
    {
        id: 'delivered_shipments',
        isMeasure: false,
        name: 'Delivered Shipments',
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_delivered' }, { type: 'number', value: 1 }, { type: 'number', value: 0 }],
        },
    },

    // delay_rate = SUM(delayed_shipments) / SUM(delivered_shipments)
    // Use delivered shipments as the denominator so pending (not delivered) rows don't dilute the rate.
    {
        id: 'delay_rate',
        isMeasure: true,
        name: 'Delay Rate',
        hide: false,
        expression: {
            operator: 'divide',
            inputs: [
                { id: 'delayed_shipments', aggregation: 'sum' },
                { id: 'delivered_shipments', aggregation: 'sum' },
            ],
        },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },

    // shipped_order_id = IF(is_shipped, order_id, NULL)
    {
        id: 'shipped_order_id',
        isMeasure: false,
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_shipped' }, { id: 'shipments.order_id' }, { type: 'string', value: null }],
        },
    },

    // on_time_order_id = IF(is_on_time, order_id, NULL)
    {
        id: 'on_time_order_id',
        isMeasure: false,
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_on_time' }, { id: 'shipments.order_id' }, { type: 'string', value: null }],
        },
    },

    // delivered_order_id = IF(is_delivered, order_id, NULL)
    {
        id: 'delivered_order_id',
        isMeasure: false,
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'is_delivered' }, { id: 'shipments.order_id' }, { type: 'string', value: null }],
        },
    },

    // delivery_status = IF(NOT is_shipped, "Not shipped",
    //                      IF(NOT is_delivered, "In transit",
    //                         IF(delayed = true, "Delayed", "On time")))
    {
        id: 'delivery_status',
        isMeasure: false,
        name: 'Delivery Status',
        expression: {
            operator: 'if',
            inputs: [
                { operator: 'not', inputs: [{ id: 'is_shipped' }] },
                { type: 'string', value: 'Not shipped' },
                {
                    operator: 'if',
                    inputs: [
                        { operator: 'not', inputs: [{ id: 'is_delivered' }] },
                        { type: 'string', value: 'In transit' },
                        {
                            operator: 'if',
                            inputs: [
                                { id: 'shipments.delayed' },
                                { type: 'string', value: 'Delayed' },
                                { type: 'string', value: 'On time' },
                            ],
                        },
                    ],
                },
            ],
        },
    },

    // returned_order_id = IF(return_flag, order_id, NULL)
    // Used for counting orders that have at least one returned line.
    {
        id: 'returned_order_id',
        isMeasure: false,
        hide: true,
        expression: {
            operator: 'if',
            inputs: [{ id: 'return_flag' }, { id: 'order_items.order_id' }, { type: 'string', value: null }],
        },
    },

    // Aggregated calculations for KPIs (using pre-aggregation expressions as inputs)
    {
        id: 'net_sales',
        isMeasure: true,
        name: 'Net Sales',
        expression: {
            id: 'line_net',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,,\\M',
        },
    },
    {
        id: 'gross_sales',
        isMeasure: true,
        name: 'Gross Sales',
        expression: {
            id: 'line_gross',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,,\\M',
        },
    },
    {
        id: 'discount_amount',
        isMeasure: true,
        name: 'Discount Amount',
        expression: {
            id: 'line_discount_amount',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,K',
        },
    },
    {
        id: 'COGS',
        isMeasure: true,
        name: 'COGS',
        expression: {
            id: 'line_cogs',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,,\\M',
        },
    },
    {
        id: 'gross_margin',
        isMeasure: true,
        name: 'Gross Margin',
        expression: {
            id: 'line_margin',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,,\\M',
        },
    },
    {
        id: 'gross_margin_percentage',
        isMeasure: true,
        name: 'Gross Margin %',
        expression: {
            operator: 'divide',
            inputs: [{ id: 'gross_margin' }, { id: 'net_sales' }],
        },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },

    // --- Orders ---
    {
        id: 'order_count',
        isMeasure: true,
        name: 'Order Count',
        expression: {
            id: 'orders.order_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0,K',
        },
    },
    {
        id: 'average_order_value',
        isMeasure: true,
        name: 'Average Order Value',
        expression: {
            operator: 'divide',
            inputs: [{ id: 'net_sales' }, { id: 'order_count' }],
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.00',
        },
    },
    {
        id: 'active_customers',
        isMeasure: true,
        name: 'Active Customers',
        expression: {
            id: 'orders.customer_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0,K',
        },
    },

    // --- Returns ---
    {
        id: 'returned_lines',
        isMeasure: true,
        name: 'Returned Lines',
        expression: {
            id: 'returned_line_flag',
            aggregation: 'sum',
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0',
        },
    },
    {
        id: 'returned_orders',
        isMeasure: true,
        name: 'Returned Orders',
        expression: {
            id: 'returned_order_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0',
        },
    },
    {
        id: 'return_rate',
        isMeasure: true,
        name: 'Return Rate (Lines)',
        expression: {
            operator: 'divide',
            inputs: [{ id: 'returned_lines' }, { id: 'order_items.order_item_id', aggregation: 'count' }],
        },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'return_value',
        isMeasure: true,
        name: 'Return Value',
        expression: {
            id: 'returned_line_net',
            aggregation: 'sum',
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,K',
        },
    },

    // return_margin_impact = -SUM(returned_line_margin)
    // Display as a negative number to represent margin lost due to returns.
    {
        id: 'return_margin_impact',
        isMeasure: true,
        name: 'Return Margin Impact',
        expression: {
            operator: 'subtract',
            inputs: [
                { type: 'number', value: 0 },
                { id: 'returned_line_margin', aggregation: 'sum' },
            ],
        },
        format: 'currencyFormat',
        formatOptions: {
            format: '£#,##0.0,K',
        },
    },

    // --- Delivery ---
    {
        id: 'shipped_orders',
        isMeasure: true,
        name: 'Shipped Orders',
        expression: {
            id: 'shipped_order_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
    },
    {
        id: 'delivered_orders',
        isMeasure: true,
        name: 'Delivered Orders',
        expression: {
            id: 'delivered_order_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
    },
    {
        id: 'delivered_not_returned_orders',
        isMeasure: true,
        name: 'Delivered (Not Returned)',
        expression: {
            operator: 'subtract',
            inputs: [{ id: 'delivered_orders' }, { id: 'returned_orders' }],
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0,K',
        },
    },
    {
        id: 'on_time_deliveries',
        isMeasure: true,
        name: 'On-time Deliveries',
        expression: {
            id: 'on_time_order_id',
            aggregation: 'countd',
        },
        format: 'integerFormat',
        formatOptions: {
            format: '#,##0,K',
        },
    },
    {
        id: 'on_time_rate',
        isMeasure: true,
        name: 'On-time Rate',
        expression: {
            operator: 'divide',
            inputs: [{ id: 'on_time_deliveries' }, { id: 'delivered_orders' }],
        },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'avg_ship_to_delivery_days',
        isMeasure: true,
        name: 'Avg Ship to Delivery Days',
        expression: {
            id: 'ship_to_delivery_days',
            aggregation: 'avg',
        },
        format: 'decimalFormat',
        formatOptions: { format: '#,##0.0' },
    },
];

// =============================================================================
// Computed Table Data (shared cache across all four pre-aggregated tables)
// =============================================================================

interface ComputedTableData {
    returnCosts: any[];
}

let computedDataPromise: Promise<ComputedTableData> | null = null;

function getComputedData(baseUrl: string): Promise<ComputedTableData> {
    return (computedDataPromise ??= buildComputedData(baseUrl));
}

async function buildComputedData(baseUrl: string): Promise<ComputedTableData> {
    const [orders, orderItems, products] = await Promise.all([
        getOrders(baseUrl),
        getOrderItems(baseUrl),
        getProducts(baseUrl),
    ]);

    const toMonthIsoStr = (raw: any): string | null => {
        const d = raw instanceof Date ? raw : raw != null && raw !== '' ? new Date(raw) : null;
        if (!d || Number.isNaN(d.getTime())) return null;
        const year = d.getUTCFullYear();
        const month1 = d.getUTCMonth() + 1;
        return `${year}-${String(month1).padStart(2, '0')}`;
    };

    // Order -> Month ISO string ("YYYY-MM")
    const orderMonthById = new Map<string, string>();
    for (const o of orders) {
        const month = toMonthIsoStr((o as any).order_datetime);
        if (month != null) {
            orderMonthById.set(String((o as any).order_id), month);
        }
    }

    // Helper to compute line-net consistent with existing expressions
    const computeLineNet = (oi: any): number => {
        const qty = Number(oi.quantity ?? 0);
        const unitPrice = Number(oi.unit_price ?? 0);
        const discountPct = Number(oi.discount_pct ?? 0);
        const gross = qty * unitPrice;
        return gross - gross * discountPct;
    };

    // Product -> unit_cost index (for margin)
    const unitCostByProductId = new Map<string, number>();
    for (const p of products) {
        unitCostByProductId.set(String((p as any).product_id), Number((p as any).unit_cost ?? 0));
    }

    const computeLineCogs = (oi: any): number => {
        const qty = Number(oi.quantity ?? 0);
        const unitCost = unitCostByProductId.get(String(oi.product_id)) ?? 0;
        return qty * unitCost;
    };

    // --- Return costs at month × subcategory granularity ---
    const productSubcategory = new Map<string, string>();
    for (const p of products) {
        productSubcategory.set(String((p as any).product_id), String((p as any).subcategory));
    }

    // Accumulate net/cogs per month×subcategory×return_reason triple
    const cellNet = new Map<string, number>();
    const cellCogs = new Map<string, number>();

    for (const oi of orderItems) {
        if ((oi as any).returned !== true) continue;
        const month = orderMonthById.get(String((oi as any).order_id));
        if (month == null) continue;
        const sub = productSubcategory.get(String((oi as any).product_id));
        if (!sub) continue;
        const reason = String((oi as any).return_reason ?? '');
        if (!reason) continue;

        const lineNet = computeLineNet(oi);
        const lineCogs = computeLineCogs(oi);
        const key = `${month}|${sub}|${reason}`;

        cellNet.set(key, (cellNet.get(key) ?? 0) + lineNet);
        cellCogs.set(key, (cellCogs.get(key) ?? 0) + lineCogs);
    }

    const allSubs = new Set<string>();
    const allReasons = new Set<string>();
    for (const key of cellNet.keys()) {
        const parts = key.split('|');
        allSubs.add(parts[1]);
        allReasons.add(parts[2]);
    }

    // Build rows for real months
    const realMonthStrs = Array.from(new Set(Array.from(cellNet.keys()).map((k) => k.split('|')[0]))).sort();
    const realRows: ReturnCostsRow[] = [];
    for (const monthStr of realMonthStrs) {
        for (const sub of allSubs) {
            for (const reason of allReasons) {
                const key = `${monthStr}|${sub}|${reason}`;
                const net = cellNet.get(key) ?? 0;
                const cogs = cellCogs.get(key) ?? 0;
                if (net === 0 && cogs === 0) continue;
                const margin = net - cogs;
                realRows.push({
                    period: `${monthStr}-01`,
                    subcategory: sub,
                    return_reason: reason,
                    refunds: Math.round(net * 0.45),
                    shipping: Math.round(margin * 0.65),
                    write_offs: Math.round(cogs * 0.35),
                });
            }
        }
    }

    return { returnCosts: realRows };
}

// =============================================================================
// Relationships
// =============================================================================

/** Page tabs for the report-builder studio state; ids match the pages in mainDemoState. */
export const mainDemoReports: { id: string; name: string }[] = [
    { id: 'executive', name: 'Executive Overview' },
    { id: 'sales-margin', name: 'Sales & Margin' },
    { id: 'fulfilment', name: 'Fulfilment & Delivery' },
    { id: 'returns', name: 'Returns & Quality' },
];

export const mainDemoCalendar: AgCalendar = {
    id: 'calendar',
    label: 'Calendar',
    range: {
        from: { literal: '2021-01-01' },
        to: { operator: 'currentDate', inputs: [] },
    },
    fragments: [
        'year',
        'quarter',
        { unit: 'month', format: 'MMM yyyy' },
        'week',
        'day',
        'monthOfYear',
        'dayOfWeek',
        'hour',
        'minute',
    ],
};

export const relationships: AgRelationDefinition[] = [
    {
        id: 'orders-customers',
        source: { tableId: 'orders', fieldId: 'customer_id' },
        target: { tableId: 'customers', fieldId: 'customer_id' },
        type: 'many-to-one',
    },
    {
        id: 'orders-stores',
        source: { tableId: 'orders', fieldId: 'store_id' },
        target: { tableId: 'stores', fieldId: 'store_id' },
        type: 'many-to-one',
    },
    {
        id: 'order_items-orders',
        source: { tableId: 'order_items', fieldId: 'order_id' },
        target: { tableId: 'orders', fieldId: 'order_id' },
        type: 'many-to-one',
    },
    {
        id: 'order_items-products',
        source: { tableId: 'order_items', fieldId: 'product_id' },
        target: { tableId: 'products', fieldId: 'product_id' },
        type: 'many-to-one',
    },
    {
        id: 'shipments-orders',
        source: { tableId: 'shipments', fieldId: 'order_id' },
        target: { tableId: 'orders', fieldId: 'order_id' },
        type: 'many-to-one',
    },
    {
        // subcategories is a real dimension (a fixed, shared vocabulary - see SUBCATS in
        // demoDataGenerator.ts) - products and return_costs each relate to it many-to-one,
        // rather than joining directly to each other on a raw duplicated string value as
        // many-to-many. return_costs is pre-aggregated to (month, subcategory, return_reason);
        // grouping order/order-item-level measures by a return_costs field still genuinely
        // fans out through this snowflake (many-to-one, many-to-one, then one-to-many back out
        // to return_costs), but that's now a plain one-to-many the existing fan-out detector
        // (fanoutDetector.ts) already reports correctly, rather than an ambiguous many-to-many
        // needing a schema-level acceptFanout override.
        id: 'products-subcategories',
        source: { tableId: 'products', fieldId: 'subcategory' },
        target: { tableId: 'subcategories', fieldId: 'subcategory' },
        type: 'many-to-one',
    },
    {
        id: 'return_costs-subcategories',
        source: { tableId: 'return_costs', fieldId: 'subcategory' },
        target: { tableId: 'subcategories', fieldId: 'subcategory' },
        type: 'many-to-one',
    },
    // Calendar bindings - fact date columns bound to the calendar
    {
        id: 'orders-calendar',
        source: { tableId: 'orders', fieldId: 'order_datetime' },
        target: { calendarId: 'calendar' },
        truncate: 'day',
    },
    {
        id: 'shipments-calendar-ship',
        source: { tableId: 'shipments', fieldId: 'ship_datetime' },
        target: { calendarId: 'calendar' },
        truncate: 'day',
    },
    {
        id: 'return_costs-calendar',
        source: { tableId: 'return_costs', fieldId: 'period' },
        target: { calendarId: 'calendar' },
    },
];

// =============================================================================
// Data Source Definition
// =============================================================================

export function getMainDemoData(baseUrl: string): AgDataSourcesDefinition {
    const url = `${baseUrl}/main-demo`;
    return {
        sources: [
            {
                id: 'stores',
                name: 'Stores',
                dataShape: 'row',
                tables: [{ id: 'stores', name: 'Stores', fields: storesFields }],
                getData: async () => ({ data: await getStores(url) }),
            },
            {
                id: 'products',
                name: 'Products',
                dataShape: 'row',
                tables: [{ id: 'products', name: 'Products', fields: productsFields }],
                getData: async () => ({ data: await getProducts(url) }),
            },
            {
                id: 'customers',
                name: 'Customers',
                dataShape: 'row',
                tables: [{ id: 'customers', name: 'Customers', fields: customersFields }],
                getData: async () => ({ data: await getCustomers(url) }),
            },
            {
                id: 'orders',
                name: 'Orders',
                dataShape: 'row',
                tables: [{ id: 'orders', name: 'Orders', fields: ordersFields }],
                getData: async () => ({ data: await getOrders(url) }),
            },
            {
                id: 'order_items',
                name: 'Order Items',
                dataShape: 'row',
                tables: [{ id: 'order_items', name: 'Order Items', fields: orderItemsFields }],
                getData: async () => ({ data: await getOrderItems(url) }),
            },
            {
                id: 'shipments',
                name: 'Shipments',
                dataShape: 'row',
                tables: [{ id: 'shipments', name: 'Shipments', fields: shipmentsFields }],
                getData: async () => ({ data: await getShipments(url) }),
            },
            {
                id: 'return_costs',
                name: 'Return Costs',
                dataShape: 'row',
                tables: [{ id: 'return_costs', name: 'Return Costs', fields: returnCostsFields }],
                getData: async () => {
                    const computed = await getComputedData(url);
                    return { data: computed.returnCosts };
                },
            },
            {
                id: 'subcategories',
                name: 'Subcategories',
                dataShape: 'row',
                tables: [{ id: 'subcategories', name: 'Subcategories', fields: subcategoriesFields }],
                getData: async () => ({
                    data: subcategoriesFromValues((await getProducts(url)).map((p) => p.subcategory)),
                }),
            },
        ],
        relationships,
        expressions,
        calendars: [mainDemoCalendar],
    };
}

// =============================================================================
// Generated Data Source - uses demoDataGenerator (sf controlled by URL/agStudioOpts)
// =============================================================================

interface ReturnCostsRow {
    period: string;
    subcategory: string;
    return_reason: string;
    refunds: number;
    shipping: number;
    write_offs: number;
}

interface SubcategoryRow {
    subcategory: string;
}

/** The distinct subcategory values in `subcategoryValues`, one row each - the `subcategories` dimension table. */
function subcategoriesFromValues(subcategoryValues: Iterable<string>): SubcategoryRow[] {
    return Array.from(new Set(subcategoryValues), (subcategory) => ({ subcategory }));
}

function buildPrecomputed(data: DemoData): { return_costs: ReturnCostsRow[] } {
    const { orders, order_items, products } = data;

    const nOrders = orders.order_id.indices.length;
    const orderMonthByIdx: string[] = new Array(nOrders);
    for (let i = 0; i < nOrders; ++i) {
        orderMonthByIdx[i] = getDictVal(orders.order_month, i);
    }

    const unitCostById = new Map<string, number>();
    const subcategoryById = new Map<string, string>();
    for (let i = 0; i < products.product_id.length; ++i) {
        unitCostById.set(products.product_id[i] as string, products.unit_cost[i] as number);
        subcategoryById.set(products.product_id[i] as string, products.subcategory[i] as string);
    }

    // Accumulate net/cogs per month×subcategory×return_reason triple
    const cellNet = new Map<string, number>();
    const cellCogs = new Map<string, number>();

    for (let i = 0; i < order_items.returned.length; ++i) {
        if (!order_items.returned[i]) continue;
        const gross = order_items.quantity[i] * order_items.unit_price[i];
        const net = gross - gross * order_items.discount_pct[i];
        const productId = getDictVal(order_items.product_id, i);
        const cogs = order_items.quantity[i] * (unitCostById.get(productId) ?? 0);
        const reason = getDictVal(order_items.return_reason, i);

        const orderIdx = order_items.order_id.indices[i];
        const monthStr = orderMonthByIdx[orderIdx];
        const sub = subcategoryById.get(productId);
        if (!monthStr || !sub || !reason) continue;

        const key = `${monthStr}|${sub}|${reason}`;
        cellNet.set(key, (cellNet.get(key) ?? 0) + net);
        cellCogs.set(key, (cellCogs.get(key) ?? 0) + cogs);
    }

    const allSubs = new Set<string>();
    const allReasons = new Set<string>();
    for (const key of cellNet.keys()) {
        const parts = key.split('|');
        allSubs.add(parts[1]);
        allReasons.add(parts[2]);
    }

    // Build rows for real months
    const realRows: ReturnCostsRow[] = [];
    const realMonthStrs = Array.from(new Set(Array.from(cellNet.keys(), (k) => k.split('|')[0]))).sort();
    for (const monthStr of realMonthStrs) {
        for (const sub of allSubs) {
            for (const reason of allReasons) {
                const key = `${monthStr}|${sub}|${reason}`;
                const net = cellNet.get(key) ?? 0;
                const cogs = cellCogs.get(key) ?? 0;
                if (net === 0 && cogs === 0) continue;
                const margin = net - cogs;
                realRows.push({
                    period: `${monthStr}-01`,
                    subcategory: sub,
                    return_reason: reason,
                    refunds: Math.round(net * 0.45),
                    shipping: Math.round(margin * 0.65),
                    write_offs: Math.round(cogs * 0.35),
                });
            }
        }
    }

    return { return_costs: realRows };
}

function isDictColumn(col: unknown): col is DictColumn {
    return col != null && typeof col === 'object' && 'indices' in col && 'indexToValue' in col;
}

function colsFromStruct(
    struct: EncodedTable | Record<string, ArrayLike<unknown>>,
    fieldIds: string[]
): ColumnsResponse {
    const data: ArrayLike<unknown>[] = [];
    const nullMasks: Array<Uint8Array | null> = [];
    const statsHints: Array<ColumnStatsHint | null> = [];
    for (const id of fieldIds) {
        const col = (struct as Record<string, unknown>)[id] ?? [];
        if (isDictColumn(col)) {
            data.push(col.indices);
            nullMasks.push(null);
            statsHints.push({ indexToValue: col.indexToValue, nullCount: col.nullCount });
        } else {
            const arr = col as ArrayLike<unknown>;
            data.push(arr);
            if (arr instanceof Float64Array) {
                let nullCount = 0;
                for (let i = 0, len = arr.length; i < len; ++i) {
                    if (arr[i] !== arr[i]) ++nullCount;
                }
                if (nullCount > 0) {
                    const bitmap = new Uint8Array(Math.ceil(arr.length / 8));
                    bitmap.fill(0xff);
                    for (let i = 0, len = arr.length; i < len; ++i) {
                        if (arr[i] !== arr[i]) bitmap[i >> 3] &= ~(1 << (i & 7));
                    }
                    nullMasks.push(bitmap);
                    statsHints.push({ nullCount });
                } else {
                    nullMasks.push(null);
                    statsHints.push({ nullCount: 0 });
                }
            } else {
                nullMasks.push(null);
                statsHints.push(null);
            }
        }
    }
    return { data, nullMasks, statsHints };
}

export function getMainDemoDataGenerated(
    createRng?: (seed: string) => () => number,
    seed?: string,
    sf?: number
): AgDataSourcesDefinition {
    const traceEnabled = ((globalThis as any).agStudioDebug ?? []).includes('traceMarkers');
    const mark = traceEnabled ? (label: string) => performance.mark(`ag:${label}`) : (_label: string) => {};

    mark('data-gen-start');
    const data = generateDemoData(createRng, seed, sf);
    mark('encode-start');
    const encoded = encodeDemoData(data);
    mark('precompute-start');
    const precomputed = buildPrecomputed(data);
    mark('data-ready');

    return {
        sources: [
            {
                id: 'stores',
                name: 'Stores',
                dataShape: 'column',
                tables: [{ id: 'stores', name: 'Stores', fields: storesFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.stores, fieldIds)),
            },
            {
                id: 'products',
                name: 'Products',
                dataShape: 'column',
                tables: [{ id: 'products', name: 'Products', fields: productsFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.products, fieldIds)),
            },
            {
                id: 'customers',
                name: 'Customers',
                dataShape: 'column',
                tables: [{ id: 'customers', name: 'Customers', fields: customersFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.customers, fieldIds)),
            },
            {
                id: 'orders',
                name: 'Orders',
                dataShape: 'column',
                tables: [{ id: 'orders', name: 'Orders', fields: ordersFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.orders, fieldIds)),
            },
            {
                id: 'order_items',
                name: 'Order Items',
                dataShape: 'column',
                tables: [{ id: 'order_items', name: 'Order Items', fields: orderItemsFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.order_items, fieldIds)),
            },
            {
                id: 'shipments',
                name: 'Shipments',
                dataShape: 'column',
                tables: [{ id: 'shipments', name: 'Shipments', fields: shipmentsFields }],
                getData: (_t, fieldIds) => Promise.resolve(colsFromStruct(encoded.shipments, fieldIds)),
            },
            {
                id: 'return_costs',
                name: 'Return Costs',
                dataShape: 'row',
                tables: [{ id: 'return_costs', name: 'Return Costs', fields: returnCostsFields }],
                getData: () => Promise.resolve({ data: precomputed.return_costs }),
            },
            {
                id: 'subcategories',
                name: 'Subcategories',
                dataShape: 'row',
                tables: [{ id: 'subcategories', name: 'Subcategories', fields: subcategoriesFields }],
                getData: () => Promise.resolve({ data: subcategoriesFromValues(data.products.subcategory) }),
            },
        ],
        relationships,
        expressions,
        calendars: [mainDemoCalendar],
    };
}
