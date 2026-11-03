import type { AgPageState, AgReportState } from 'ag-studio';

import type { ServiceHealthRegistry } from './heatmapWidget';

/**
 * The dashboard the demo opens on: the error budget and filters in a rail on the left, the
 * headline numbers and each service's error rate over time beside them, then errors and traffic
 * over time, traffic by region and slow requests, each service's current status, and the event log
 * underneath.
 *
 * Every chart over time groups by the second, through the `second` bucket in `data.ts`.
 *
 * Charts group by the lookup tables' `name` fields rather than the live tables' own columns, so
 * clicking a region or a service cross-filters the event log as well as the traffic.
 *
 * The 24-column grid matches the other demos (`xTrack` 0-24).
 */
const homePage: AgPageState<ServiceHealthRegistry> = {
    id: 'home',
    widgets: {
        // Headline numbers, each with its trend over the window.
        'kpi-requests': {
            type: 'value',
            dataMapping: { value: [{ id: 'requestsPerSecond' }], sparklineX: [{ id: 'traffic.second::second' }] },
            format: { title: { enabled: true, text: 'Requests / s' } },
        },
        'kpi-error-rate': {
            type: 'value',
            dataMapping: { value: [{ id: 'errorRate' }], sparklineX: [{ id: 'traffic.second::second' }] },
            format: { title: { enabled: true, text: 'Error Rate' } },
        },
        'kpi-latency': {
            type: 'value',
            dataMapping: { value: [{ id: 'latencyP95' }], sparklineX: [{ id: 'traffic.second::second' }] },
            format: { title: { enabled: true, text: 'p95 Latency (ms)' } },
        },
        'gauge-error-budget': {
            type: 'radial-gauge',
            dataMapping: { value: [{ id: 'errorBudget' }] },
            format: {
                title: { enabled: true, text: 'Error Budget' },
                style: {
                    padding: 8,
                    scaleLabel: { enabled: false, min: 0, max: 1 },
                    label: { enabled: true, typography: { fontSize: 30, fontWeight: 'bold' } },
                    secondaryLabel: { enabled: true, text: 'left of SLO 99%' },
                },
            },
        },

        'filter-environment': {
            type: 'button-filter',
            dataMapping: { value: [{ id: 'environments.name' }] },
            format: { title: { enabled: true, text: 'Environment' }, style: { dimensions: { height: 22 } } },
        },
        'filter-window': {
            type: 'date-filter',
            dataMapping: { value: [{ id: 'traffic.second' }] },
            format: { title: { enabled: true, text: 'Window' }, style: { filterType: 'relative' } },
        },
        'filter-service': {
            type: 'list-filter',
            dataMapping: { value: [{ id: 'services.name' }] },
            format: { title: { enabled: true, text: 'Service' } },
        },
        'chart-requests': {
            type: 'area-chart-stacked',
            dataMapping: {
                categoryKey: [{ id: 'traffic.second::second' }],
                valueKey: [{ id: 'traffic.requests', aggregation: 'sum' }],
                legendKey: [{ id: 'services.name' }],
            },
            sort: [{ field: { id: 'traffic.second::second' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Requests per Second by Service, Last 5 Minutes' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'bottom' } },
                    },
                },
            },
        },

        // Errors as columns against the error rate as a line, so an incident stands out from a
        // moment that simply had more traffic.
        'chart-errors': {
            type: 'combo-chart-grouped-column-line',
            dataMapping: {
                categoryKey: [{ id: 'traffic.second::second' }],
                valueKey: [{ id: 'errorsPerMinute' }],
                secondaryValueKey: [{ id: 'errorRatePercent' }],
            },
            sort: [{ field: { id: 'traffic.second::second' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Errors and Error Rate, Last 5 Minutes' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'bottom' } },
                        line: { series: { marker: { enabled: false } } },
                    },
                },
            },
        },
        // Error rate rather than latency, as each service's latency sits at its own baseline, which
        // would set the colours; an incident shows as a hot streak in one service's row.
        'chart-error-heatmap': {
            type: 'heatmap-chart',
            dataMapping: {
                x: [{ id: 'traffic.second::second' }],
                y: [{ id: 'services.name' }],
                color: [{ id: 'errorRatePercent' }],
            },
            format: { title: { enabled: true, text: 'Error Rate (%) by Service, Last 5 Minutes' } },
        },
        'chart-regions': {
            type: 'donut-chart',
            dataMapping: {
                categoryKey: [{ id: 'regions.name' }],
                valueKey: [{ id: 'totalRequests' }],
            },
            format: {
                title: { enabled: true, text: 'Traffic by Region' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'right' } } },
                    custom: {
                        pieDataLabel: { enabled: true, format: 'percent' },
                        totalLabel: { enabled: true },
                    },
                },
            },
        },
        'chart-durations': {
            type: 'histogram-chart',
            dataMapping: { categoryKey: [{ id: 'events.durationMs' }] },
            format: {
                title: { enabled: true, text: 'Slow Request Durations (ms)' },
                // A border in the widget's background colour, so neighbouring bins read apart.
                style: { custom: { seriesStroke: { enabled: true } } },
            },
        },

        // A row per service that opens into its regions, with each reading updated in place and
        // each change shown beside it, coloured by the theme's value change params.
        'grid-status': {
            type: 'pivot-grid',
            dataMapping: {
                rows: [{ id: 'status.service' }, { id: 'status.region' }],
                columns: [],
                values: [
                    { id: 'statusRequestsPerSecond' },
                    { id: 'statusErrorRate' },
                    { id: 'statusLatencyP95' },
                    { id: 'statusCpu' },
                ],
            },
            format: {
                title: { enabled: true, text: 'Service Status' },
                style: { grandTotalRow: { enabled: false }, animateValueChanges: true },
            },
        },

        // A click would cross filter on every column of one event, narrowing the dashboard to it.
        'grid-events': {
            type: 'grid',
            dataMapping: {
                cols: [
                    { id: 'events.time' },
                    { id: 'events.severity' },
                    { id: 'events.service' },
                    { id: 'events.region' },
                    { id: 'events.environment' },
                    { id: 'events.message' },
                    { id: 'events.durationMs' },
                ],
            },
            sort: [{ field: { id: 'events.time' }, direction: 'desc' }],
            format: { title: { enabled: true, text: 'Event Log' }, triggerCrossFilter: false },
        },
    },
    widgetLayout: {
        // Rail: the error budget above the filters.
        'gauge-error-budget': { xTrack: 0, yTrack: 0, xSpan: 5, ySpan: 12 },
        'filter-environment': { xTrack: 0, yTrack: 12, xSpan: 5, ySpan: 8 },
        'filter-window': { xTrack: 0, yTrack: 20, xSpan: 5, ySpan: 13 },
        'filter-service': { xTrack: 0, yTrack: 33, xSpan: 5, ySpan: 14 },

        'kpi-requests': { xTrack: 5, yTrack: 0, xSpan: 6, ySpan: 12 },
        'kpi-error-rate': { xTrack: 11, yTrack: 0, xSpan: 6, ySpan: 12 },
        'kpi-latency': { xTrack: 17, yTrack: 0, xSpan: 7, ySpan: 12 },
        'chart-error-heatmap': { xTrack: 5, yTrack: 12, xSpan: 19, ySpan: 35 },

        'chart-errors': { xTrack: 0, yTrack: 47, xSpan: 12, ySpan: 20 },
        'chart-requests': { xTrack: 12, yTrack: 47, xSpan: 12, ySpan: 20 },

        'chart-regions': { xTrack: 0, yTrack: 67, xSpan: 9, ySpan: 18 },
        'chart-durations': { xTrack: 9, yTrack: 67, xSpan: 15, ySpan: 18 },

        'grid-status': { xTrack: 0, yTrack: 85, xSpan: 24, ySpan: 26 },
        'grid-events': { xTrack: 0, yTrack: 111, xSpan: 24, ySpan: 22 },
    },
    filter: {},
};

export const serviceHealthState: AgReportState<ServiceHealthRegistry> = {
    pages: [homePage],
    selectedPageId: 'home',
    panels: {
        edit: { collapsed: true },
        filters: { collapsed: true },
        data: { collapsed: true },
    },
};
