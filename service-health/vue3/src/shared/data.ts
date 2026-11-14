import type {
    AgDataSourcesDefinition,
    AgDateBucketDefinition,
    AgExpression,
    AgExpressionFieldDefinition,
    AgFieldDefinition,
} from 'ag-studio';
import { createBuckets } from 'ag-studio';

import type { ServiceHealthRegistry } from './heatmapWidget';
import type { ServiceHealthSimulation } from './simulation';
import { ENVIRONMENTS, REGIONS, SERVICES, SLO_ERROR_RATE } from './simulation';

const INT = { format: 'integerFormat' } as const;

const trafficFields: AgFieldDefinition[] = [
    { id: 'id', name: 'ID', ...INT, hide: true },
    { id: 'second', name: 'Time', format: 'dateTimeFormat', formatOptions: { format: 'HH:mm:ss' } },
    { id: 'environment', name: 'Environment', format: 'textFormat' },
    { id: 'region', name: 'Region', format: 'textFormat' },
    { id: 'service', name: 'Service', format: 'textFormat' },
    { id: 'requests', name: 'Requests', ...INT },
    { id: 'errorsPerMinute', name: 'Errors / min', ...INT },
    { id: 'latencyP95Ms', name: 'p95 Latency (ms)', ...INT },
];

const eventsFields: AgFieldDefinition[] = [
    { id: 'id', name: 'ID', ...INT, hide: true },
    { id: 'time', name: 'Time', format: 'dateTimeFormat', formatOptions: { format: 'HH:mm:ss' } },
    { id: 'environment', name: 'Environment', format: 'textFormat' },
    { id: 'region', name: 'Region', format: 'textFormat' },
    { id: 'service', name: 'Service', format: 'textFormat' },
    { id: 'severity', name: 'Severity', format: 'textFormat' },
    { id: 'message', name: 'Message', format: 'textFormat' },
    { id: 'durationMs', name: 'Duration (ms)', ...INT, blankValue: '' },
];

const statusFields: AgFieldDefinition[] = [
    { id: 'id', name: 'ID', ...INT, hide: true },
    { id: 'service', name: 'Service', format: 'textFormat' },
    { id: 'region', name: 'Region', format: 'textFormat' },
    { id: 'environment', name: 'Environment', format: 'textFormat' },
    { id: 'health', name: 'Health', format: 'textFormat' },
    { id: 'requests', name: 'Requests / min', ...INT },
    { id: 'requestsPerSecond', name: 'Requests / s', format: 'decimalFormat', formatOptions: { format: '#,##0.0' } },
    { id: 'errors', name: 'Errors / min', ...INT },
    { id: 'errorRate', name: 'Error Rate', format: 'percentageFormat', formatOptions: { format: '#,##0.00%' } },
    { id: 'latencyP95Ms', name: 'p95 Latency (ms)', ...INT },
    { id: 'cpu', name: 'CPU', format: 'percentageFormat', formatOptions: { format: '#,##0%' } },
];

const measure = (
    id: string,
    name: string,
    expression: AgExpressionFieldDefinition['expression'],
    format: Pick<AgExpressionFieldDefinition, 'format' | 'formatOptions'>
): AgExpressionFieldDefinition => ({ id, name, isMeasure: true, expression, ...format });

const PERCENT = { format: 'percentageFormat', formatOptions: { format: '#,##0.00%' } } as const;

/**
 * Rounds an expression to the decimal places its format shows. The status table animates every
 * change to a raw value and formats the difference like the value, so an unrounded measure would
 * show changes too small to see as an arrow beside `0.00%`.
 */
const roundTo = (expression: AgExpression, places: number): AgExpression => ({
    operator: 'round',
    inputs: [expression, { type: 'number', value: places }],
});

const expressions: AgExpressionFieldDefinition[] = [
    measure('totalRequests', 'Requests', { id: 'traffic.requests', aggregation: 'sum' }, INT),
    measure('errorsPerMinute', 'Errors / min', { id: 'traffic.errorsPerMinute', aggregation: 'sum' }, INT),
    measure('seconds', 'Seconds', { id: 'traffic.second', aggregation: 'countd' }, INT),
    measure('latencyP95', 'p95 Latency (ms)', { id: 'traffic.latencyP95Ms', aggregation: 'avg' }, INT),
    measure(
        'requestsPerSecond',
        'Requests / s',
        { operator: 'divide', inputs: [{ id: 'totalRequests' }, { id: 'seconds' }] },
        INT
    ),
    // Errors are a rate per minute and requests a count per second, so requests are scaled to match.
    measure(
        'errorRate',
        'Error Rate',
        {
            operator: 'divide',
            inputs: [
                { id: 'errorsPerMinute' },
                { operator: 'multiply', inputs: [{ id: 'totalRequests' }, { type: 'number', value: 60 }] },
            ],
        },
        PERCENT
    ),
    // As a number of percent, for chart axes, which show raw numbers rather than formatting them.
    measure(
        'errorRatePercent',
        'Error Rate (%)',
        { operator: 'multiply', inputs: [{ id: 'errorRate' }, { type: 'number', value: 100 }] },
        { format: 'decimalFormat', formatOptions: { format: '#,##0.00' } }
    ),
    // The status table's columns, as measures so they keep their own names. A service's row rolls
    // its regions up into its total traffic, overall error rate, worst latency and average CPU.
    measure(
        'statusRequestsPerSecond',
        'Requests / s',
        roundTo({ id: 'status.requestsPerSecond', aggregation: 'sum' }, 1),
        { format: 'decimalFormat', formatOptions: { format: '#,##0.0' } }
    ),
    measure('statusRequests', 'Requests / min', { id: 'status.requests', aggregation: 'sum' }, INT),
    measure('statusErrors', 'Errors / min', { id: 'status.errors', aggregation: 'sum' }, INT),
    measure(
        'statusErrorRate',
        'Error Rate',
        roundTo({ operator: 'divide', inputs: [{ id: 'statusErrors' }, { id: 'statusRequests' }] }, 4),
        PERCENT
    ),
    measure('statusLatencyP95', 'p95 Latency (ms)', { id: 'status.latencyP95Ms', aggregation: 'max' }, INT),
    measure('statusCpu', 'CPU', roundTo({ id: 'status.cpu', aggregation: 'avg' }, 2), {
        format: 'percentageFormat',
        formatOptions: { format: '#,##0%' },
    }),
    // The share of the error budget left: all of it at no errors, none once the error rate
    // reaches the SLO.
    measure(
        'errorBudget',
        'Error Budget Remaining',
        {
            operator: 'greatest',
            inputs: [
                { type: 'number', value: 0 },
                {
                    operator: 'subtract',
                    inputs: [
                        { type: 'number', value: 1 },
                        {
                            operator: 'divide',
                            inputs: [{ id: 'errorRate' }, { type: 'number', value: SLO_ERROR_RATE }],
                        },
                    ],
                },
            ],
        },
        { format: 'percentageFormat', formatOptions: { format: '#,##0%' } }
    ),
];

const nameField: AgFieldDefinition = { id: 'name', name: 'Name', format: 'textFormat' };

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Groups a datetime by the second, which the built-in grains stop short of. Each key is the
 * second's epoch time, so keys sort in time order and are evenly spaced.
 */
const secondBucket: AgDateBucketDefinition = {
    id: 'second',
    longName: 'Second',
    shortName: 'sec',
    grain: 'minute',
    components: ['year', 'month', 'day', 'hour', 'minute', 'second'],
    // Studio extracts the components in UTC.
    encode: ([year, month, day, hour, minute, second]) => Date.UTC(year, month - 1, day, hour, minute, second) / 1000,
    decode: (key) => {
        const time = new Date(key * 1000);
        return [
            time.getUTCFullYear(),
            time.getUTCMonth() + 1,
            time.getUTCDate(),
            time.getUTCHours(),
            time.getUTCMinutes(),
            time.getUTCSeconds(),
        ];
    },
    // Shown in local time, as the tables' own times are. Rounded, as an axis tick can fall between keys.
    format: () => (key: number) => {
        const time = new Date(Math.round(key) * 1000);
        return `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
    },
};

/**
 * The demo's data: the three live tables from the simulation, and three small lookup tables they
 * all link to. A filter or cross filter on a lookup table's `name` reaches every live table, which
 * a filter on one live table's own column would not.
 */
export function getServiceHealthData(
    simulation: ServiceHealthSimulation
): AgDataSourcesDefinition<ServiceHealthRegistry> {
    const link = (table: string, field: string, lookup: string) => ({
        id: `${table}-${lookup}`,
        source: { tableId: table, fieldId: field },
        target: { tableId: lookup, fieldId: 'name' },
        type: 'many-to-one' as const,
    });

    return {
        sources: [
            {
                id: 'traffic',
                name: 'Traffic',
                transactions: 'all',
                primaryKeyField: 'id',
                fields: trafficFields,
                data: simulation.getTraffic(),
            },
            {
                id: 'events',
                name: 'Events',
                transactions: 'all',
                primaryKeyField: 'id',
                fields: eventsFields,
                data: simulation.getEvents(),
            },
            {
                id: 'status',
                name: 'Status',
                transactions: 'all',
                primaryKeyField: 'id',
                fields: statusFields,
                data: simulation.getStatus(),
            },
            {
                id: 'services',
                name: 'Services',
                fields: [nameField, { id: 'team', name: 'Team', format: 'textFormat' }],
                data: SERVICES.map(({ name, team }) => ({ name, team })),
            },
            {
                id: 'regions',
                name: 'Regions',
                fields: [nameField],
                data: REGIONS.map(({ name }) => ({ name })),
            },
            {
                id: 'environments',
                name: 'Environments',
                fields: [nameField],
                data: ENVIRONMENTS.map(({ name }) => ({ name })),
            },
        ],
        relationships: [
            link('traffic', 'service', 'services'),
            link('traffic', 'region', 'regions'),
            link('traffic', 'environment', 'environments'),
            link('events', 'service', 'services'),
            link('events', 'region', 'regions'),
            link('events', 'environment', 'environments'),
            link('status', 'service', 'services'),
            link('status', 'region', 'regions'),
            link('status', 'environment', 'environments'),
        ],
        expressions,
        buckets: createBuckets<ServiceHealthRegistry>({ additionalTypes: [secondBucket] }),
    };
}
