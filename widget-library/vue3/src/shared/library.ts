import type {
    AgAreaChartStacked,
    AgBarChartGrouped,
    AgBaseRegistry,
    AgBaseWidgetDefinition,
    AgButtonFilterWidget,
    AgColumnChartGrouped,
    AgColumnChartStacked,
    AgCreateWidgetsParams,
    AgDateFilterWidget,
    AgDefaultRegistry,
    AgDefaultWidgetDefinition,
    AgDefaultWidgetType,
    AgGridWidget,
    AgLineChart,
    AgListFilterWidget,
    AgPieChart,
    AgPivotGridWidget,
    AgRadialGauge,
    AgValueWidget,
    AgWidgetData,
    AgWidgetDataFormat,
    AgWidgetsConfig,
} from 'ag-studio';

import type { BarGaugeDef } from './barGauge';
import { BAR_GAUGE_WIDGET, withoutCrossFilterSection } from './barGauge';

/**
 * A curated, categorised library of pre-built usage-analytics widgets. Each entry
 * clones a built-in widget definition and pins a `defaultState` (data mapping +
 * format + sort), so the admin composes a dashboard by dragging ready-made widgets
 * — never authoring a widget, editing an expression, or touching raw data. The
 * per-widget `form` is trimmed to the widget-picker section only, so no data-mapping
 * or expression editing surfaces on placed widgets.
 */

type PcwWidgetId =
    // Overview
    | 'pcw-mau'
    | 'pcw-dau'
    | 'pcw-stickiness'
    | 'pcw-seat-utilisation-card'
    | 'pcw-adoption-rate'
    // Engagement
    | 'pcw-active-users-trend'
    | 'pcw-sessions-actions'
    | 'pcw-new-vs-returning'
    | 'pcw-retention'
    // Adoption
    | 'pcw-feature-adoption'
    | 'pcw-adoption-by-category'
    | 'pcw-adoption-by-team'
    | 'pcw-top-workflows'
    // Users & Teams
    | 'pcw-most-active-users'
    | 'pcw-team-activity'
    | 'pcw-at-risk-users'
    | 'pcw-recent-signups'
    // Licences & Governance
    | 'pcw-seat-utilisation-gauge'
    | 'pcw-licence-allocation'
    | 'pcw-pending-invites'
    | 'pcw-compliance-flags'
    // Slicers
    | 'pcw-slicer-team'
    | 'pcw-slicer-feature'
    | 'pcw-slicer-date';

type BarGaugeWidgetDefinition = AgBaseWidgetDefinition<'pcw-bar-gauge', BarGaugeDef>;

export interface PcwRegistry extends AgBaseRegistry {
    widgets: readonly (AgDefaultWidgetDefinition | AgBaseWidgetDefinition<PcwWidgetId> | BarGaugeWidgetDefinition)[];
}

/** The Bar Gauge's component, written in whichever framework the variant uses. */
export type BarGaugeComp = BarGaugeWidgetDefinition['comp'];

// Grafana renders stat/number panels in a monospace face (its own
// `fontFamilyMonospace` token, 'Roboto Mono'), so KPI numerals line up and read
// as instrument readouts rather than prose. Fallbacks cover systems without it.
const PCW_MONO_FONT = "'Roboto Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace";

/** Grafana's solid stat-panel colours, for cards that fill their panel the way its stat panels do. */
export const STAT_BLUE = '#1F60C4';
export const STAT_GREEN = '#37872D';
export const STAT_PURPLE = '#8F3BB8';
export const STAT_ORANGE = '#E0752D';
export const STAT_LIGHT_GREEN = '#56A64B';

/**
 * A KPI card's format. Given a colour, the card fills its panel with it, as a Grafana stat panel in
 * background colour mode does.
 */
export function statCardFormat(label: string, color?: string): AgValueWidget['format'] {
    return {
        caption: { enabled: true, text: label, ...(color ? { color: 'rgb(255 255 255 / 85%)' } : {}) },
        ...(color ? { widget: { backgroundColor: color, borderEnabled: false } } : {}),
        style: {
            typography: { fontFamily: PCW_MONO_FONT, fontWeight: 'bold' },
            textScaling: { enabled: true },
            ...(color ? { color: '#ffffff' } : {}),
        },
    };
}

const CATEGORY_OVERVIEW = 'Overview';
const CATEGORY_ENGAGEMENT = 'Engagement';
const CATEGORY_ADOPTION = 'Adoption';
const CATEGORY_USERS = 'Users & Teams';
const CATEGORY_GOVERNANCE = 'Licences & Governance';
const CATEGORY_FILTERS = 'Filters & Text';

/**
 * The catalogue itself, as the parameters `createWidgets` takes.
 *
 * Which `createWidgets` is deliberately left to the caller: `ag-studio` backs the built-in widget
 * types with its own renderers, `ag-studio-react` with React components. That import, and the Bar
 * Gauge's component, are the only things that differ between this demo's framework variants.
 */
export const widgetLibraryParams = (
    config: AgWidgetsConfig<AgDefaultRegistry>,
    barGaugeComp: BarGaugeComp
): AgCreateWidgetsParams<PcwRegistry> => {
    // Trim the form to the widget-picker only — no data-mapping / expression editing.
    const compositionOnlyForm: AgBaseWidgetDefinition<PcwWidgetId>['form'] = (params) => ({
        type: 'tab-group',
        key: 'config',
        items: [
            {
                type: 'tab',
                key: 'setup',
                label: 'widgetFormSectionSetup',
                items: [params.createWidgetSection()],
            },
        ],
    });

    const make = (
        id: PcwWidgetId,
        baseId: AgDefaultWidgetType,
        label: string,
        defaultState: Partial<AgWidgetData<unknown, AgWidgetDataFormat<unknown>>>
    ): AgBaseWidgetDefinition<PcwWidgetId> => {
        const baseDef = config.widgets.find((w) => w.id === baseId);
        if (!baseDef) {
            throw new Error(`AG Studio: unknown base widget '${baseId}' for '${id}'.`);
        }
        return {
            ...baseDef,
            id,
            label,
            defaultState,
            extends: baseId,
            formatShape: undefined,
            form: compositionOnlyForm,
        };
    };

    // KPIs bind to model expressions (measures that aggregate the team hub), so no
    // widget-level aggregation is needed and they recompute under a team slicer.
    const card = (id: PcwWidgetId, label: string, fieldId: string, color?: string) =>
        make(id, 'value', label, {
            dataMapping: { value: [{ id: fieldId }] },
            format: statCardFormat(label, color),
        } satisfies Partial<AgValueWidget>);

    type GridCol = string | { id: string; aggregation: 'sum' | 'avg' };
    const grid = (id: PcwWidgetId, label: string, cols: GridCol[], sort?: AgGridWidget['sort'], totals = true) =>
        make(id, 'grid', label, {
            dataMapping: { cols: cols.map((c) => (typeof c === 'string' ? { id: c } : c)) },
            sort,
            format: {
                title: { enabled: true, text: label },
                // Grand total only where numeric columns aggregate to something meaningful.
                ...(totals ? { style: { grandTotalRow: { enabled: true } } } : {}),
            },
        } satisfies Partial<AgGridWidget>);

    // ── Overview ─────────────────────────────────────────────────────────────
    const overview = [
        card('pcw-mau', 'Monthly Active Users', 'mau', STAT_BLUE),
        card('pcw-dau', 'Daily Active Users', 'dau', STAT_GREEN),
        card('pcw-stickiness', 'Stickiness', 'stickiness', STAT_PURPLE),
        card('pcw-seat-utilisation-card', 'Seat Utilisation', 'seatUtilisation', STAT_ORANGE),
        card('pcw-adoption-rate', 'Adoption Rate', 'adoptionRate', STAT_LIGHT_GREEN),
    ];

    // ── Engagement ───────────────────────────────────────────────────────────
    const engagement = [
        make('pcw-active-users-trend', 'line-chart', 'Active Users Trend', {
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
                        categoryAxis: { gridLine: { enabled: true } },
                        valueAxis: { title: { enabled: true, text: 'Users' }, gridLine: { enabled: true } },
                    },
                },
            },
        } satisfies Partial<AgLineChart>),
        make('pcw-sessions-actions', 'line-chart', 'Sessions & Actions', {
            dataMapping: {
                categoryKey: [{ id: 'usage.month' }],
                valueKey: [
                    { id: 'usage.sessions', aggregation: 'sum' },
                    { id: 'usage.actionsCount', aggregation: 'sum' },
                ],
            },
            sort: [{ field: { id: 'usage.month' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Sessions & Actions' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'bottom' } },
                        line: { series: { marker: { enabled: false } } },
                    },
                    custom: {
                        categoryAxis: { gridLine: { enabled: true } },
                        valueAxis: { title: { enabled: true, text: 'Count' }, gridLine: { enabled: true } },
                    },
                },
            },
        } satisfies Partial<AgLineChart>),
        make('pcw-new-vs-returning', 'area-chart-stacked', 'New vs Returning Users', {
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
        } satisfies Partial<AgAreaChartStacked>),
        // Cohort retention as grouped columns by week - clustered columns read
        // better than lines for a small number of discrete week offsets.
        make('pcw-retention', 'column-chart-grouped', 'Retention', {
            dataMapping: {
                categoryKey: [{ id: 'retention.weekOffset' }],
                valueKey: [{ id: 'retention.retainedPct', aggregation: 'avg' }],
                legendKey: [{ id: 'retention.cohort' }],
            },
            sort: [{ field: { id: 'retention.weekOffset' }, direction: 'asc' }],
            format: {
                title: { enabled: true, text: 'Retention by Cohort' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'bottom' } } },
                    custom: {
                        categoryAxis: { title: { enabled: true, text: 'Weeks since signup' } },
                        valueAxis: { title: { enabled: true, text: 'Retained' } },
                    },
                },
            },
        } satisfies Partial<AgColumnChartGrouped>),
    ];

    // ── Adoption ─────────────────────────────────────────────────────────────
    const teamAdoptionGauge: BarGaugeWidgetDefinition = {
        ...BAR_GAUGE_WIDGET,
        comp: barGaugeComp,
        label: 'Team Adoption',
        form: (params) => {
            const defaultForm = params.createDefaults({});
            const [setup] = defaultForm.items;
            setup.items = withoutCrossFilterSection(setup.items);
            return defaultForm;
        },
        defaultState: {
            dataMapping: {
                category: [{ id: 'teams.name' }],
                value: [{ id: 'teams.adoptionPct', aggregation: 'avg' }],
            },
            format: {
                title: { enabled: true, text: 'Team Adoption' },
                style: { max: 1, amberFrom: 50, greenFrom: 75 },
            },
        },
    };
    const adoption = [
        teamAdoptionGauge,
        make('pcw-feature-adoption', 'bar-chart-grouped', 'Feature Adoption', {
            dataMapping: {
                categoryKey: [{ id: 'adoption.feature' }],
                valueKey: [{ id: 'adoption.adoptionPct', aggregation: 'avg' }],
            },
            sort: [{ field: { id: 'adoption.adoptionPct', aggregation: 'avg' }, direction: 'desc' }],
            format: {
                title: { enabled: true, text: 'Feature Adoption' },
                style: {
                    theme: { bar: { series: { width: 14 } } },
                    custom: {
                        valueAxis: { title: { enabled: true, text: 'Adoption' }, gridLine: { enabled: true } },
                    },
                },
            },
        } satisfies Partial<AgBarChartGrouped>),
        make('pcw-adoption-by-category', 'pie-chart', 'Adoption by Category', {
            dataMapping: {
                categoryKey: [{ id: 'adoption.category' }],
                valueKey: [{ id: 'adoption.adoptionPct', aggregation: 'avg' }],
            },
            format: {
                title: { enabled: true, text: 'Adoption by Category' },
                style: {
                    theme: { common: { legend: { enabled: true, position: 'right' } } },
                    // Each slice is an average rate, so its share of the whole would mean nothing.
                    custom: { pieDataLabel: { enabled: true, format: 'value', position: 'outside' } },
                },
            },
        } satisfies Partial<AgPieChart>),
        make('pcw-adoption-by-team', 'pivot-grid', 'Adoption by Team', {
            dataMapping: {
                rows: [{ id: 'adoption.team' }],
                columns: [{ id: 'adoption.feature' }],
                values: [{ id: 'adoption.adoptionPct', aggregation: 'avg' }],
            },
            format: { title: { enabled: true, text: 'Adoption by Team' } },
        } satisfies Partial<AgPivotGridWidget>),
        make('pcw-top-workflows', 'bar-chart-grouped', 'Top Workflows', {
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
        } satisfies Partial<AgBarChartGrouped>),
    ];

    // ── Users & Teams ────────────────────────────────────────────────────────
    const users = [
        grid(
            'pcw-most-active-users',
            'Most Active Users',
            [
                'users.name',
                'users.team',
                'users.lastActive',
                { id: 'users.sessions30d', aggregation: 'sum' },
                { id: 'users.actions30d', aggregation: 'sum' },
            ],
            [{ field: { id: 'users.sessions30d' }, direction: 'desc' }]
        ),
        grid('pcw-team-activity', 'Team Activity', [
            'teams.name',
            { id: 'teams.activeUsers', aggregation: 'sum' },
            { id: 'teams.seatsAssigned', aggregation: 'sum' },
            { id: 'teams.adoptionPct', aggregation: 'avg' },
            { id: 'teams.actions', aggregation: 'sum' },
        ]),
        grid(
            'pcw-at-risk-users',
            'At-risk / Inactive Users',
            [
                'users.name',
                'users.team',
                'users.lastActive',
                { id: 'users.daysInactive', aggregation: 'avg' },
                'users.status',
            ],
            [{ field: { id: 'users.daysInactive' }, direction: 'desc' }]
        ),
        grid(
            'pcw-recent-signups',
            'Recent Sign-ups',
            ['users.name', 'users.team', 'users.signupDate', 'users.status'],
            [{ field: { id: 'users.signupDate' }, direction: 'desc' }],
            false
        ),
    ];

    // ── Licences & Governance ──────────────────────────────────────────────────
    const governance = [
        make('pcw-seat-utilisation-gauge', 'radial-gauge', 'Seat Utilisation', {
            dataMapping: { value: [{ id: 'seatsActiveTotal' }] },
            format: { title: { enabled: true, text: 'Seat Utilisation' }, style: { scaleLabel: { max: 500 } } },
        } satisfies Partial<AgRadialGauge>),
        make('pcw-licence-allocation', 'column-chart-stacked', 'Licence Allocation by Team', {
            dataMapping: {
                categoryKey: [{ id: 'teams.name' }],
                valueKey: [
                    { id: 'teams.seatsActive', aggregation: 'sum' },
                    { id: 'teams.seatsInactive', aggregation: 'sum' },
                ],
            },
            format: {
                title: { enabled: true, text: 'Licence Allocation by Team' },
                style: {
                    theme: {
                        common: { legend: { enabled: true, position: 'bottom' } },
                        bar: { series: { width: 32 } },
                    },
                    custom: {
                        valueAxis: { title: { enabled: true, text: 'Seats' }, gridLine: { enabled: true } },
                    },
                },
            },
        } satisfies Partial<AgColumnChartStacked>),
        card('pcw-pending-invites', 'Pending Invites', 'pendingInvites'),
        grid(
            'pcw-compliance-flags',
            'Security & Compliance Flags',
            ['governance.rule', 'governance.status', 'governance.detail'],
            undefined,
            false
        ),
    ];

    // ── Slicers (pre-bound filters for read-only cross-filtering) ──────────────
    const slicers = [
        make('pcw-slicer-team', 'list-filter', 'Team', {
            dataMapping: { value: [{ id: 'teams.name' }] },
        } satisfies Partial<AgListFilterWidget>),
        make('pcw-slicer-feature', 'button-filter', 'Feature Category', {
            dataMapping: { value: [{ id: 'adoption.category' }] },
        } satisfies Partial<AgButtonFilterWidget>),
        make('pcw-slicer-date', 'date-filter', 'Date Range', {
            dataMapping: { value: [{ id: 'usage.month' }] },
        } satisfies Partial<AgDateFilterWidget>),
    ];

    return {
        defaultType: 'pcw-mau',
        menu: [
            { label: CATEGORY_ENGAGEMENT, widgetIds: engagement.map((w) => w.id) },
            { label: CATEGORY_OVERVIEW, widgetIds: overview.map((w) => w.id) },
            { label: CATEGORY_ADOPTION, widgetIds: adoption.map((w) => w.id) },
            { label: CATEGORY_USERS, widgetIds: users.map((w) => w.id) },
            { label: CATEGORY_GOVERNANCE, widgetIds: governance.map((w) => w.id) },
            // Filters (slicers) + the built-in text widget, grouped as utility widgets.
            { label: CATEGORY_FILTERS, widgetIds: [...slicers.map((w) => w.id), 'text'] },
        ],
        additionalTypes: [...overview, ...engagement, ...adoption, ...users, ...governance, ...slicers],
    };
};
