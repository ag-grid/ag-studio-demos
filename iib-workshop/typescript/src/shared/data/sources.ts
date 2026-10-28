import type { AgDataSourcesDefinition } from 'ag-studio';

import type { AppRegistry } from '../widgets/types';
import { EDIT_WARS_SOURCE, EDIT_WARS_TOP_SOURCE, EDIT_WARS_TYPE_SOURCE, editWarsData } from './editWars';
import { LONGEVITY_EVIDENCE_SOURCE, LONGEVITY_LINKS_SOURCE, LONGEVITY_SOURCE, longevityData } from './longevity';

/** One sample table per custom widget the real data cannot exercise (map, organisation, quadrant). */
export const SOURCE = {
    org: 'org',
    territories: 'territories',
    freight: 'freight',
    readings: 'readings',
    monthly: 'monthly',
    stores: 'stores',
    sales: 'sales',
    portfolio: 'portfolio',
} as const;

const org = {
    id: SOURCE.org,
    name: 'Staff Directory (demo)',
    description:
        'Twelve invented employees, for the Organization Chart widget. Each row names one person and the manager they report to, which is what gives the chart its shape.',
    data: [
        { employeeId: '1', managerId: null, name: 'Sarah Chen', title: 'CEO' },
        { employeeId: '2', managerId: '1', name: 'James Liu', title: 'VP Engineering' },
        { employeeId: '3', managerId: '1', name: 'Maria Garcia', title: 'VP Sales' },
        { employeeId: '4', managerId: '1', name: 'Tom Wilson', title: 'VP Operations' },
        { employeeId: '5', managerId: '2', name: 'Anna Lee', title: 'Engineering Manager' },
        { employeeId: '6', managerId: '2', name: 'Dev Patel', title: 'Platform Lead' },
        { employeeId: '7', managerId: '3', name: 'Chris Brown', title: 'Sales Manager' },
        { employeeId: '8', managerId: '3', name: 'Lisa Kim', title: 'Account Manager' },
        { employeeId: '9', managerId: '4', name: 'Ben Adams', title: 'Operations Manager' },
        { employeeId: '10', managerId: '5', name: 'Priya Nair', title: 'Senior Engineer' },
        { employeeId: '11', managerId: '5', name: 'Luca Rossi', title: 'Engineer' },
        { employeeId: '12', managerId: '6', name: 'Grace Okoro', title: 'Site Reliability' },
    ],
    fields: [
        {
            id: 'employeeId',
            name: 'Employee ID',
            format: 'textFormat',
            description: 'Unique per person. Map this to Id.',
        },
        {
            id: 'managerId',
            name: 'Manager ID',
            format: 'textFormat',
            description: 'The Employee ID this person reports to, blank for the CEO. Map this to Parent Id.',
        },
        { id: 'name', name: 'Name', format: 'textFormat' },
        { id: 'title', name: 'Job Title', format: 'textFormat' },
    ],
};

const territories = {
    id: SOURCE.territories,
    name: 'Country Sales (demo)',
    description:
        'Thirteen invented sales territories, for the World Map widget. Country names are the join key onto the map outlines; latitude and longitude place the bubbles.',
    data: [
        { country: 'United States', revenue: 48200, latitude: 39.8, longitude: -98.6 },
        { country: 'Canada', revenue: 12400, latitude: 56.1, longitude: -106.3 },
        { country: 'Brazil', revenue: 9800, latitude: -14.2, longitude: -51.9 },
        { country: 'United Kingdom', revenue: 21600, latitude: 54.0, longitude: -2.0 },
        { country: 'France', revenue: 15300, latitude: 46.6, longitude: 2.2 },
        { country: 'Germany', revenue: 24100, latitude: 51.2, longitude: 10.4 },
        { country: 'Spain', revenue: 7200, latitude: 40.2, longitude: -3.7 },
        { country: 'Italy', revenue: 8900, latitude: 41.9, longitude: 12.6 },
        { country: 'India', revenue: 18700, latitude: 20.6, longitude: 79.0 },
        { country: 'China', revenue: 39500, latitude: 35.9, longitude: 104.2 },
        { country: 'Japan', revenue: 22800, latitude: 36.2, longitude: 138.3 },
        { country: 'Australia', revenue: 10600, latitude: -25.3, longitude: 133.8 },
        { country: 'South Africa', revenue: 5400, latitude: -30.6, longitude: 22.9 },
    ],
    fields: [
        {
            id: 'country',
            name: 'Country',
            format: 'textFormat',
            description:
                'Spelled to match the country outlines in worldTopology.ts, for example "United States" and "United Kingdom". Change a spelling and that country stops shading.',
        },
        { id: 'revenue', name: 'Revenue', format: 'integerFormat', description: 'Thousands of US dollars.' },
        {
            id: 'latitude',
            name: 'Latitude',
            format: 'decimalFormat',
            description: 'Degrees north, for bubble placement.',
        },
        {
            id: 'longitude',
            name: 'Longitude',
            format: 'decimalFormat',
            description: 'Degrees east, for bubble placement.',
        },
    ],
};

const freight = {
    id: SOURCE.freight,
    name: 'Shipping Routes (demo)',
    description:
        "Six invented shipping lanes over two quarters, for the Route Map widget. Route names are the join key onto the drawn lines; volume sets each line's thickness.",
    data: [
        { route: 'Rotterdam - New York', quarter: 'Q1', teu: 41000 },
        { route: 'Rotterdam - New York', quarter: 'Q2', teu: 46500 },
        { route: 'Mumbai - Shanghai', quarter: 'Q1', teu: 88000 },
        { route: 'Mumbai - Shanghai', quarter: 'Q2', teu: 94200 },
        { route: 'Hamburg - Mumbai', quarter: 'Q1', teu: 27500 },
        { route: 'Hamburg - Mumbai', quarter: 'Q2', teu: 25900 },
        { route: 'Santos - Durban', quarter: 'Q1', teu: 12300 },
        { route: 'Santos - Durban', quarter: 'Q2', teu: 13800 },
        { route: 'Sydney - Yokohama', quarter: 'Q1', teu: 19400 },
        { route: 'Sydney - Yokohama', quarter: 'Q2', teu: 21100 },
        { route: 'New York - Santos', quarter: 'Q1', teu: 33600 },
        { route: 'New York - Santos', quarter: 'Q2', teu: 31200 },
    ],
    fields: [
        {
            id: 'route',
            name: 'Route',
            format: 'textFormat',
            description:
                'Spelled to match the drawn lines in routes.ts, for example "Rotterdam - New York". Change a spelling and that lane disappears.',
        },
        { id: 'quarter', name: 'Quarter', format: 'textFormat' },
        {
            id: 'teu',
            name: 'Containers',
            format: 'integerFormat',
            description: 'Twenty-foot equivalent units shipped.',
        },
    ],
};

// Several observations per machine, so min/avg/max over the same field describe a spread.
const readings = {
    id: SOURCE.readings,
    name: 'Line Timings (demo)',
    description:
        'Four timed batches on each of four invented production lines, for the Error Bars widget. Repeated readings per line are what let the widget draw a spread rather than a single point.',
    data: [
        { machine: 'Line A', batch: '1', cycleSeconds: 41.2 },
        { machine: 'Line A', batch: '2', cycleSeconds: 44.8 },
        { machine: 'Line A', batch: '3', cycleSeconds: 39.6 },
        { machine: 'Line A', batch: '4', cycleSeconds: 43.1 },
        { machine: 'Line B', batch: '1', cycleSeconds: 52.7 },
        { machine: 'Line B', batch: '2', cycleSeconds: 61.4 },
        { machine: 'Line B', batch: '3', cycleSeconds: 48.9 },
        { machine: 'Line B', batch: '4', cycleSeconds: 57.2 },
        { machine: 'Line C', batch: '1', cycleSeconds: 35.5 },
        { machine: 'Line C', batch: '2', cycleSeconds: 36.1 },
        { machine: 'Line C', batch: '3', cycleSeconds: 34.8 },
        { machine: 'Line C', batch: '4', cycleSeconds: 35.9 },
        { machine: 'Line D', batch: '1', cycleSeconds: 46.3 },
        { machine: 'Line D', batch: '2', cycleSeconds: 55.8 },
        { machine: 'Line D', batch: '3', cycleSeconds: 44.1 },
        { machine: 'Line D', batch: '4', cycleSeconds: 51.6 },
    ],
    fields: [
        { id: 'machine', name: 'Production Line', format: 'textFormat' },
        { id: 'batch', name: 'Batch', format: 'textFormat' },
        {
            id: 'cycleSeconds',
            name: 'Cycle Time',
            format: 'decimalFormat',
            description:
                'Seconds per cycle. Map the same field to the low, middle and high bounds as min, average and max.',
        },
    ],
};

const monthly = {
    id: SOURCE.monthly,
    name: 'Monthly Revenue (demo)',
    description:
        'One invented year of monthly revenue, for the Annotated Line widget and the built-in time series. `monthStart` is a real Date rather than a label, which is what the date filter and any temporal axis need.',
    data: [
        { month: 'Jan', monthStart: new Date(Date.UTC(2025, 0, 1)), revenue: 18200 },
        { month: 'Feb', monthStart: new Date(Date.UTC(2025, 1, 1)), revenue: 19100 },
        { month: 'Mar', monthStart: new Date(Date.UTC(2025, 2, 1)), revenue: 21400 },
        { month: 'Apr', monthStart: new Date(Date.UTC(2025, 3, 1)), revenue: 20800 },
        { month: 'May', monthStart: new Date(Date.UTC(2025, 4, 1)), revenue: 26700 },
        { month: 'Jun', monthStart: new Date(Date.UTC(2025, 5, 1)), revenue: 31500 },
        { month: 'Jul', monthStart: new Date(Date.UTC(2025, 6, 1)), revenue: 30100 },
        { month: 'Aug', monthStart: new Date(Date.UTC(2025, 7, 1)), revenue: 24300 },
        { month: 'Sep', monthStart: new Date(Date.UTC(2025, 8, 1)), revenue: 27900 },
        { month: 'Oct', monthStart: new Date(Date.UTC(2025, 9, 1)), revenue: 33600 },
        { month: 'Nov', monthStart: new Date(Date.UTC(2025, 10, 1)), revenue: 38200 },
        { month: 'Dec', monthStart: new Date(Date.UTC(2025, 11, 1)), revenue: 41700 },
    ],
    fields: [
        { id: 'month', name: 'Month', format: 'textFormat' },
        {
            id: 'monthStart',
            name: 'Month Start',
            format: 'dateFormat',
            description:
                'The first of the month as a real date, so temporal axes and the date filter have something to bucket.',
        },
        { id: 'revenue', name: 'Revenue', format: 'integerFormat', description: 'Thousands of US dollars.' },
    ],
};

const stores = {
    id: SOURCE.stores,
    name: 'UK Stores (demo)',
    description:
        'Twenty invented county totals, for the UK Map widget. County names are the join key onto the county outlines; Region groups them for a coarser view.',
    data: [
        { county: 'GREATER LONDON', region: 'London', revenue: 9800 },
        { county: 'WEST MIDLANDS', region: 'Midlands', revenue: 4200 },
        { county: 'GREATER MANCHESTER', region: 'North West', revenue: 3900 },
        { county: 'WEST YORKSHIRE', region: 'Yorkshire', revenue: 3400 },
        { county: 'MERSEYSIDE', region: 'North West', revenue: 2800 },
        { county: 'SOUTH YORKSHIRE', region: 'Yorkshire', revenue: 2500 },
        { county: 'TYNE AND WEAR', region: 'North East', revenue: 2200 },
        { county: 'ESSEX', region: 'East of England', revenue: 2900 },
        { county: 'KENT', region: 'South East', revenue: 2800 },
        { county: 'HAMPSHIRE', region: 'South East', revenue: 2700 },
        { county: 'HERTFORDSHIRE', region: 'East of England', revenue: 2600 },
        { county: 'SURREY', region: 'South East', revenue: 2500 },
        { county: 'LANCASHIRE', region: 'North West', revenue: 2400 },
        { county: 'DEVON', region: 'South West', revenue: 2100 },
        { county: 'NOTTINGHAMSHIRE', region: 'Midlands', revenue: 1900 },
        { county: 'STAFFORDSHIRE', region: 'Midlands', revenue: 1800 },
        { county: 'NORFOLK', region: 'East of England', revenue: 1500 },
        { county: 'SOMERSET', region: 'South West', revenue: 1300 },
        { county: 'CUMBRIA', region: 'North West', revenue: 900 },
        { county: 'CORNWALL', region: 'South West', revenue: 800 },
    ],
    fields: [
        {
            id: 'county',
            name: 'County',
            format: 'textFormat',
            description:
                'Upper case, spelled to match the ONS county outlines in ukTopology.ts, for example "GREATER LONDON". Change a spelling and that county stops shading.',
        },
        {
            id: 'region',
            name: 'Region',
            format: 'textFormat',
            description: 'The county rolled up to one of nine English regions. Group by this for a coarser breakdown.',
        },
        { id: 'revenue', name: 'Revenue', format: 'decimalFormat', description: 'Millions of pounds.' },
    ],
};

const sales = {
    id: SOURCE.sales,
    name: 'Regional Sales (demo)',
    description:
        'Three invented regions across four quarters, for the Quadrant widget. Two measures on the same row are what give the quadrant its x and y axes.',
    data: [
        { region: 'EMEA', quarter: 'Q1', revenue: 1200, units: 40 },
        { region: 'EMEA', quarter: 'Q2', revenue: 1500, units: 50 },
        { region: 'EMEA', quarter: 'Q3', revenue: 1800, units: 60 },
        { region: 'EMEA', quarter: 'Q4', revenue: 2100, units: 70 },
        { region: 'APAC', quarter: 'Q1', revenue: 800, units: 25 },
        { region: 'APAC', quarter: 'Q2', revenue: 1100, units: 35 },
        { region: 'APAC', quarter: 'Q3', revenue: 1300, units: 45 },
        { region: 'APAC', quarter: 'Q4', revenue: 1600, units: 55 },
        { region: 'Americas', quarter: 'Q1', revenue: 1500, units: 50 },
        { region: 'Americas', quarter: 'Q2', revenue: 1800, units: 60 },
        { region: 'Americas', quarter: 'Q3', revenue: 2200, units: 75 },
        { region: 'Americas', quarter: 'Q4', revenue: 2500, units: 85 },
    ],
    fields: [
        { id: 'region', name: 'Region', format: 'textFormat' },
        { id: 'quarter', name: 'Quarter', format: 'textFormat' },
        { id: 'revenue', name: 'Revenue', format: 'decimalFormat', description: 'Thousands of US dollars.' },
        { id: 'units', name: 'Units Sold', format: 'integerFormat' },
    ],
};

const portfolio = {
    id: SOURCE.portfolio,
    name: 'Product Mix (demo)',
    description:
        'Sixteen invented products, for the Quadrant widget. Three measures on one row are what give the quadrant its two axes and its bubble size, and sixteen rows are enough for the four regions to each hold something.',
    data: [
        { product: 'Atlas', revenue: 4820, growth: 31, customers: 210 },
        { product: 'Beacon', revenue: 1240, growth: 62, customers: 88 },
        { product: 'Cinder', revenue: 6310, growth: 8, customers: 540 },
        { product: 'Delta', revenue: 2870, growth: 44, customers: 165 },
        { product: 'Ember', revenue: 940, growth: 71, customers: 52 },
        { product: 'Fathom', revenue: 5150, growth: 12, customers: 430 },
        { product: 'Grove', revenue: 3480, growth: 27, customers: 240 },
        { product: 'Harbour', revenue: 7920, growth: 5, customers: 810 },
        { product: 'Ingot', revenue: 1680, growth: 49, customers: 120 },
        { product: 'Juniper', revenue: 2310, growth: 18, customers: 190 },
        { product: 'Kestrel', revenue: 610, growth: 84, customers: 34 },
        { product: 'Lantern', revenue: 4070, growth: 22, customers: 305 },
        { product: 'Meridian', revenue: 8640, growth: 3, customers: 960 },
        { product: 'Nimbus', revenue: 1490, growth: 57, customers: 96 },
        { product: 'Orchard', revenue: 3020, growth: 15, customers: 255 },
        { product: 'Pennant', revenue: 5740, growth: 38, customers: 470 },
    ],
    fields: [
        { id: 'product', name: 'Product', format: 'textFormat' },
        { id: 'revenue', name: 'Revenue', format: 'integerFormat', description: 'Thousands of US dollars.' },
        {
            id: 'growth',
            name: 'Growth',
            format: 'integerFormat',
            description: 'Percent year on year. Pairs with Revenue to give the quadrant two independent axes.',
        },
        { id: 'customers', name: 'Customers', format: 'integerFormat', description: 'Sets the bubble size.' },
    ],
};

/** Prefixes each table with its dataset's letter. Applied here so regenerating the data keeps it. */
const lettered = <T extends { name?: string }>(letter: string, tables: T[]): T[] =>
    tables.map((table) => ({ ...table, name: `${letter} · ${table.name}` }));

export const dataSources = {
    // The data panel lists tables in definition order: real data first, then the demo tables.
    sources: [
        ...lettered('A', editWarsData.sources),
        ...lettered('B', longevityData.sources),
        ...lettered('C', [org, territories, freight, readings, monthly, stores, sales, portfolio]),
    ],

    /**
     * Article to dispute type, many-to-one. `acceptFanout` because repeating the type's figure per
     * article is the point; summing a type-level measure across articles over-counts it.
     */
    relationships: [
        {
            id: 'articles-to-type',
            source: { tableId: EDIT_WARS_SOURCE, fieldId: 'conflictType' },
            target: { tableId: EDIT_WARS_TYPE_SOURCE, fieldId: 'conflictType' },
            type: 'many-to-one',
            acceptFanout: true,
        },
        {
            id: 'top-articles-to-type',
            source: { tableId: EDIT_WARS_TOP_SOURCE, fieldId: 'conflictType' },
            target: { tableId: EDIT_WARS_TYPE_SOURCE, fieldId: 'conflictType' },
            type: 'many-to-one',
            acceptFanout: true,
        },
        /**
         * Longevity: each intervention to its evidence level, so Evidence Score can sit beside
         * any intervention field. Many-to-one, and `acceptFanout` for the same reason as the
         * dispute types above: a level's score repeats against each of its interventions by
         * design, so average it rather than summing it.
         */
        {
            id: 'longevity-to-evidence',
            source: { tableId: LONGEVITY_SOURCE, fieldId: 'evidenceStrength' },
            target: { tableId: LONGEVITY_EVIDENCE_SOURCE, fieldId: 'evidenceStrength' },
            type: 'many-to-one',
            acceptFanout: true,
        },
        /**
         * Longevity: each cited link to the intervention it supports. The fan-out guard stays
         * on here, because an intervention has several links and summing Years Gained or Lost
         * across them would count it once per link. Counting links per intervention, or per
         * website, is the use this join is for.
         */
        {
            id: 'longevity-links-to-interventions',
            source: { tableId: LONGEVITY_LINKS_SOURCE, fieldId: 'interventionId' },
            target: { tableId: LONGEVITY_SOURCE, fieldId: 'interventionId' },
            type: 'many-to-one',
        },
    ],
} as AgDataSourcesDefinition<AppRegistry>;
