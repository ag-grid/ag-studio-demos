import type { AgPageState, AgReportState } from 'ag-studio';

import type { PcwRegistry } from './library';
import { STAT_BLUE, STAT_GREEN, STAT_LIGHT_GREEN, STAT_ORANGE, STAT_PURPLE, statCardFormat } from './library';

/**
 * The default composed "house view" the workspace admin lands on: a half-width
 * title, the Overview cards, the team slicer beside the two engagement trends,
 * then team adoption, seat utilisation and top workflows. The top right of the
 * canvas, beside the title, is left empty so it's obvious where a widget can be
 * dragged in. The demo opens mid-compose — the widget library (edit panel) is
 * open; the filters and data panels are collapsed.
 *
 * The 24-column grid matches the main demo (`xTrack` 0–24).
 */
const homePage: AgPageState<PcwRegistry> = {
    id: 'home',
    widgets: {
        title: {
            type: 'text',
            dataMapping: {},
            format: {
                // Every other widget sits in a bordered panel; a heading reads better without one.
                widget: { borderEnabled: false, backgroundColor: 'transparent' },
                style: {
                    text: 'Workspace Usage & Adoption',
                    textAlign: 'left',
                    typography: { fontWeight: 'bold' },
                },
            },
        },

        // Overview cards
        'house-mau': {
            type: 'pcw-mau',
            dataMapping: { value: [{ id: 'mau' }] },
            format: statCardFormat('Monthly Active Users', STAT_BLUE),
        },
        'house-dau': {
            type: 'pcw-dau',
            dataMapping: { value: [{ id: 'dau' }] },
            format: statCardFormat('Daily Active Users', STAT_GREEN),
        },
        'house-stickiness': {
            type: 'pcw-stickiness',
            dataMapping: { value: [{ id: 'stickiness' }] },
            format: statCardFormat('Stickiness', STAT_PURPLE),
        },
        'house-seat-utilisation': {
            type: 'pcw-seat-utilisation-card',
            dataMapping: { value: [{ id: 'seatUtilisation' }] },
            format: statCardFormat('Seat Utilisation', STAT_ORANGE),
        },
        'house-adoption-rate': {
            type: 'pcw-adoption-rate',
            dataMapping: { value: [{ id: 'adoptionRate' }] },
            format: statCardFormat('Adoption Rate', STAT_LIGHT_GREEN),
        },

        // Team slicer — filters the team-scoped widgets (read-only cross-filter)
        'house-slicer-team': {
            type: 'pcw-slicer-team',
            dataMapping: { value: [{ id: 'teams.name' }] },
            format: { title: { enabled: true, text: 'Team' } },
        },

        // Active Users (monthly, per-team — filters under the Team slicer)
        'house-active-users-trend': {
            type: 'pcw-active-users-trend',
            dataMapping: {
                categoryKey: [{ id: 'usage.month' }],
                valueKey: [
                    { id: 'usage.activeUsers', aggregation: 'sum' },
                    { id: 'usage.newUsers', aggregation: 'sum' },
                    { id: 'usage.returningUsers', aggregation: 'sum' },
                ],
            },
            sort: [{ field: { id: 'usage.month' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Active Users' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'bottom' } },
                        line: { series: { marker: { enabled: false }, interpolation: { type: 'smooth' } } },
                    },
                    custom: {
                        valueAxis: { title: { enabled: true, text: 'Users' } },
                    },
                },
            },
        },

        // New vs Returning (stacked area)
        'house-new-vs-returning': {
            type: 'pcw-new-vs-returning',
            dataMapping: {
                categoryKey: [{ id: 'usage.month' }],
                valueKey: [
                    { id: 'usage.newUsers', aggregation: 'sum' },
                    { id: 'usage.returningUsers', aggregation: 'sum' },
                ],
            },
            sort: [{ field: { id: 'usage.month' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'New vs Returning Users' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'bottom' } } },
                    custom: {
                        valueAxis: { title: { enabled: true, text: 'Users' } },
                    },
                },
            },
        },

        'house-team-adoption': {
            type: 'pcw-bar-gauge',
            dataMapping: {
                category: [{ id: 'teams.name' }],
                value: [{ id: 'teams.adoptionPct', aggregation: 'avg' }],
            },
            format: {
                title: { enabled: true, text: 'Team Adoption' },
                style: { max: 1, amberFrom: 50, greenFrom: 75 },
            },
        },
        'house-seat-gauge': {
            type: 'pcw-seat-utilisation-gauge',
            dataMapping: { value: [{ id: 'seatsActiveTotal' }] },
            format: { title: { enabled: true, text: 'Seat Utilisation' }, style: { scaleLabel: { max: 500 } } },
        },
        'house-top-workflows': {
            type: 'pcw-top-workflows',
            dataMapping: {
                categoryKey: [{ id: 'workflows.name' }],
                valueKey: [{ id: 'workflows.count', aggregation: 'sum' }],
            },
            sort: [{ field: { id: 'workflows.count', aggregation: 'sum' }, direction: 'desc' }],
            format: {
                title: { enabled: true, text: 'Top Workflows' },
                style: {
                    theme: { bar: { series: { width: 14, label: { enabled: true } } } },
                    custom: {
                        valueAxis: { title: { enabled: true, text: 'Runs' }, gridLine: { enabled: true } },
                    },
                },
            },
        },
    },
    widgetLayout: {
        // Half-width title, leaving the top-right of the canvas as a pre-set empty
        // slot so it's immediately obvious where a widget can be dragged in.
        title: { xTrack: 0, yTrack: 0, xSpan: 12, ySpan: 3 },

        'house-mau': { xTrack: 0, yTrack: 3, xSpan: 5, ySpan: 6 },
        'house-dau': { xTrack: 5, yTrack: 3, xSpan: 5, ySpan: 6 },
        'house-stickiness': { xTrack: 10, yTrack: 3, xSpan: 5, ySpan: 6 },
        'house-seat-utilisation': { xTrack: 15, yTrack: 3, xSpan: 5, ySpan: 6 },
        'house-adoption-rate': { xTrack: 20, yTrack: 3, xSpan: 4, ySpan: 6 },

        // Row 1: team slicer rail + two engagement trends (line + stacked area).
        // Trends get generous height — they are the hero charts and y-tracks are
        // short, so a large ySpan is what makes them read as full-size time series.
        'house-slicer-team': { xTrack: 0, yTrack: 9, xSpan: 4, ySpan: 19 },
        'house-active-users-trend': { xTrack: 4, yTrack: 9, xSpan: 10, ySpan: 19 },
        'house-new-vs-returning': { xTrack: 14, yTrack: 9, xSpan: 10, ySpan: 19 },

        // Row 2: the custom LED bar gauge, a dial, and a ranked bar chart.
        'house-team-adoption': { xTrack: 0, yTrack: 28, xSpan: 8, ySpan: 18 },
        'house-seat-gauge': { xTrack: 8, yTrack: 28, xSpan: 6, ySpan: 18 },
        'house-top-workflows': { xTrack: 14, yTrack: 28, xSpan: 10, ySpan: 18 },
    },
    filter: {},
};

export const preconfiguredWidgetsState: AgReportState<PcwRegistry> = {
    pages: [homePage],
    selectedPageId: 'home',
    panels: {
        // Open mid-compose: widget library (edit panel) visible, others collapsed.
        edit: { collapsed: false },
        filters: { collapsed: true },
        data: { collapsed: true },
    },
};
