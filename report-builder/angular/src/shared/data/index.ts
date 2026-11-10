// The AcmeSaaS retail dataset every demo shares: a generated six-table schema, the fields and
// relationships over it, and the report state that lays it out.
export type {
    Customer,
    CustomerData,
    DemoData,
    DictColumn,
    EncodedDemoData,
    EncodedTable,
    Order,
    OrderData,
    OrderItem,
    OrderItemData,
    Product,
    ProductData,
    Shipment,
    ShipmentData,
    Store,
    StoreData,
} from './demoDataGenerator';
export { buildDict, encodeDemoData, generateDemoData, getDictVal } from './demoDataGenerator';
export {
    customersFields,
    expressions,
    getMainDemoData,
    getMainDemoDataGenerated,
    mainDemoCalendar,
    mainDemoReports,
    orderItemsFields,
    ordersFields,
    productsFields,
    relationships,
    shipmentsFields,
    storesFields,
} from './mainDemoData';
export { executivePage, mainDemoState } from './mainDemoState';
