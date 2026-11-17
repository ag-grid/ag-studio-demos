import type { AgDataSourcesDefinition, AgExpressionFieldDefinition, AgFieldDefinition } from 'ag-studio';

import type { DemoData } from './generator';
import { generateDemoData } from './generator';
import type { PcwRegistry } from './library';

// =============================================================================
// Field definitions
// =============================================================================

const PCT = { format: 'percentageFormat', formatOptions: { format: '#,##0%' } } as const;
const INT = { format: 'integerFormat' } as const;

const teamsFields: AgFieldDefinition[] = [
    { id: 'name', name: 'Team', format: 'textFormat' },
    { id: 'headcount', name: 'Headcount', ...INT },
    { id: 'seatsPurchased', name: 'Seats Purchased', ...INT },
    { id: 'seatsAssigned', name: 'Seats Assigned', ...INT },
    { id: 'seatsActive', name: 'Seats Active', ...INT },
    { id: 'seatsInactive', name: 'Seats Inactive', ...INT },
    { id: 'activeUsers', name: 'Active Users', ...INT },
    { id: 'dau', name: 'Daily Active Users', ...INT },
    { id: 'wau', name: 'Weekly Active Users', ...INT },
    { id: 'pendingInvites', name: 'Pending Invites', ...INT },
    { id: 'actions', name: 'Actions', ...INT },
    { id: 'adoptionPct', name: 'Adoption', ...PCT },
];

const usageFields: AgFieldDefinition[] = [
    { id: 'team', name: 'Team', format: 'textFormat' },
    { id: 'month', name: 'Month', format: 'dateFormat', formatOptions: { format: 'MMM yyyy' } },
    { id: 'activeUsers', name: 'Active Users', ...INT },
    { id: 'sessions', name: 'Sessions', ...INT },
    { id: 'actionsCount', name: 'Actions', ...INT },
    { id: 'newUsers', name: 'New Users', ...INT },
    { id: 'returningUsers', name: 'Returning Users', ...INT },
];

const adoptionFields: AgFieldDefinition[] = [
    { id: 'team', name: 'Team', format: 'textFormat' },
    { id: 'feature', name: 'Feature', format: 'textFormat' },
    { id: 'category', name: 'Category', format: 'textFormat' },
    { id: 'adoptionPct', name: 'Adoption', ...PCT },
];

const usersFields: AgFieldDefinition[] = [
    { id: 'name', name: 'User', format: 'textFormat' },
    { id: 'team', name: 'Team', format: 'textFormat' },
    { id: 'role', name: 'Role', format: 'textFormat' },
    { id: 'signupDate', name: 'Signed Up', format: 'dateFormat' },
    { id: 'lastActive', name: 'Last Active', format: 'dateFormat' },
    { id: 'daysInactive', name: 'Days Inactive', ...INT },
    { id: 'sessions30d', name: 'Sessions (30d)', ...INT },
    { id: 'actions30d', name: 'Actions (30d)', ...INT },
    { id: 'status', name: 'Status', format: 'textFormat' },
];

const workflowsFields: AgFieldDefinition[] = [
    { id: 'name', name: 'Workflow', format: 'textFormat' },
    { id: 'count', name: 'Runs', ...INT },
];

const retentionFields: AgFieldDefinition[] = [
    { id: 'cohort', name: 'Cohort', format: 'textFormat' },
    { id: 'weekOffset', name: 'Week', ...INT },
    { id: 'retainedPct', name: 'Retained', ...PCT },
];

const governanceFields: AgFieldDefinition[] = [
    { id: 'rule', name: 'Rule', format: 'textFormat' },
    { id: 'status', name: 'Status', format: 'textFormat' },
    { id: 'detail', name: 'Detail', format: 'textFormat' },
];

// =============================================================================
// Org-level KPI expressions — aggregate the team hub, so they recompute when a
// team is selected in a slicer.
// =============================================================================

const measure = (
    id: string,
    name: string,
    fieldId: string,
    format: AgExpressionFieldDefinition['format']
): AgExpressionFieldDefinition => ({
    id,
    name,
    isMeasure: true,
    format,
    expression: { id: fieldId, aggregation: 'sum' },
});

const ratio = (id: string, name: string, numerator: string, denominator: string): AgExpressionFieldDefinition => ({
    id,
    name,
    isMeasure: true,
    format: 'percentageFormat',
    formatOptions: { format: '#,##0%' },
    expression: { operator: 'divide', inputs: [{ id: numerator }, { id: denominator }] },
});

const expressions: AgExpressionFieldDefinition[] = [
    measure('mau', 'Monthly Active Users', 'teams.activeUsers', 'integerFormat'),
    measure('dau', 'Daily Active Users', 'teams.dau', 'integerFormat'),
    measure('wau', 'Weekly Active Users', 'teams.wau', 'integerFormat'),
    measure('pendingInvites', 'Pending Invites', 'teams.pendingInvites', 'integerFormat'),
    measure('seatsActiveTotal', 'Seats Active', 'teams.seatsActive', 'integerFormat'),
    measure('seatsPurchasedTotal', 'Seats Purchased', 'teams.seatsPurchased', 'integerFormat'),
    measure('seatsAssignedTotal', 'Seats Assigned', 'teams.seatsAssigned', 'integerFormat'),
    ratio('stickiness', 'Stickiness', 'dau', 'mau'),
    ratio('seatUtilisation', 'Seat Utilisation', 'seatsActiveTotal', 'seatsPurchasedTotal'),
    ratio('adoptionRate', 'Adoption Rate', 'seatsActiveTotal', 'seatsAssignedTotal'),
];

// =============================================================================
// Data source definition
// =============================================================================

function rowSource<T extends object>(id: string, name: string, fields: AgFieldDefinition[], rows: T[]) {
    return {
        id,
        name,
        dataShape: 'row' as const,
        tables: [{ id, name, fields }],
        getData: () => Promise.resolve({ data: rows }),
    };
}

export function getPreconfiguredWidgetsData(): AgDataSourcesDefinition<PcwRegistry> {
    const d: DemoData = generateDemoData();

    return {
        sources: [
            rowSource('teams', 'Teams', teamsFields, d.teams),
            rowSource('usage', 'Usage', usageFields, d.usage),
            rowSource('adoption', 'Adoption', adoptionFields, d.adoption),
            rowSource('users', 'Users', usersFields, d.users),
            rowSource('workflows', 'Workflows', workflowsFields, d.workflows),
            rowSource('retention', 'Retention', retentionFields, d.retention),
            rowSource('governance', 'Governance', governanceFields, d.governance),
        ],
        // Link every team-grained source to the team hub so a Team slicer filters
        // the whole dashboard (KPI expressions aggregate `teams`; usage/adoption/users
        // propagate through these relationships).
        relationships: [
            {
                id: 'usage-teams',
                source: { tableId: 'usage', fieldId: 'team' },
                target: { tableId: 'teams', fieldId: 'name' },
                type: 'many-to-one',
            },
            {
                id: 'adoption-teams',
                source: { tableId: 'adoption', fieldId: 'team' },
                target: { tableId: 'teams', fieldId: 'name' },
                type: 'many-to-one',
            },
            {
                id: 'users-teams',
                source: { tableId: 'users', fieldId: 'team' },
                target: { tableId: 'teams', fieldId: 'name' },
                type: 'many-to-one',
            },
        ],
        expressions,
    };
}
