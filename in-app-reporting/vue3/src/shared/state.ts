import type { AgBaseRegistry, AgDefaultRegistry, AgPageState, AgReportState, AgWidgetState } from 'ag-studio';

import type { PeerGroupRegistry } from './interfaces';

function withoutCrossFilterTrigger<TWidget extends { format?: object }>(widget: TWidget): TWidget {
    return { ...widget, format: { ...widget.format, triggerCrossFilter: false } };
}

// The demo's widgets drill through to a company report from their context menu, so a click starts
// no cross filter anywhere.
function withoutCrossFilter<TRegistry extends AgBaseRegistry>(
    state: AgReportState<TRegistry>
): AgReportState<TRegistry> {
    const pages = state.pages.map((page) => {
        const widgets: AgPageState<TRegistry>['widgets'] = {};
        for (const [id, widget] of Object.entries(page.widgets ?? {})) {
            if (widget) {
                widgets[id] = withoutCrossFilterTrigger(widget);
            }
        }
        return { ...page, widgets };
    });
    return { ...state, pages };
}

// Each overview viewport is a Studio instance showing one full-canvas widget: a one-page report
// with a single widget, sized by the standalone layout.
function singleWidgetState(id: string, widget: AgWidgetState<AgDefaultRegistry>): AgReportState {
    return withoutCrossFilter({
        pages: [
            {
                id: 'page1',
                widgets: { [id]: widget },
                widgetLayout: { [id]: { xTrack: 0, yTrack: 0, xSpan: 24, ySpan: 24 } },
            },
        ],
        selectedPageId: 'page1',
    });
}

export const companiesState: AgReportState = singleWidgetState('companies', {
    type: 'grid',
    dataMapping: {
        cols: [
            {
                id: 'companies.ticker',
            },
            {
                id: 'companies.name',
            },
            {
                id: 'company_metrics.price',
            },
            {
                id: 'company_metrics.changePct',
            },
            {
                id: 'company_metrics.marketCap',
            },
            {
                id: 'company_metrics.peRatioTrailing',
            },
            {
                id: 'company_metrics.revenueGrowthPct',
            },
            {
                id: 'company_metrics.ebitdaMargin',
            },
        ],
    },
    format: {
        title: {
            enabled: true,
            text: 'Companies',
        },
        subtitle: {
            enabled: true,
            text: 'Right-click a company to open its report',
        },
        style: {
            grandTotalRow: {
                enabled: false,
            },
        },
    },
    sort: [
        {
            field: {
                id: 'company_metrics.marketCap',
            },
            direction: 'desc',
        },
    ],
});

export const marketCapState: AgReportState = singleWidgetState('marketCap', {
    type: 'bar-chart-grouped',
    dataMapping: {
        categoryKey: [{ id: 'companies.ticker' }],
        valueKey: [{ id: 'company_metrics.marketCap', aggregation: 'sum' }],
    },
    format: {
        title: {
            enabled: true,
            text: 'Market Cap',
        },
    },
    sort: [
        {
            field: {
                id: 'company_metrics.marketCap',
                aggregation: 'sum',
            },
            direction: 'desc',
        },
    ],
});

export const sharePriceState: AgReportState = singleWidgetState('sharePrice', {
    type: 'line-chart',
    dataMapping: {
        categoryKey: [{ id: 'calendar::month' }],
        valueKey: [{ id: 'price_history.close', aggregation: 'avg' }],
        legendKey: [{ id: 'companies.ticker' }],
    },
    format: {
        title: {
            enabled: true,
            text: 'Share Price',
        },
        subtitle: {
            enabled: true,
            text: 'Monthly average close, USD',
        },
        style: {
            theme: {
                common: {
                    legend: {
                        enabled: true,
                    },
                },
                line: {
                    series: {
                        marker: {
                            enabled: false,
                        },
                    },
                },
            },
        },
    },
    sort: [
        {
            field: {
                id: 'calendar::month',
            },
            direction: 'asc',
        },
    ],
});

export const revenueState: AgReportState = singleWidgetState('revenue', {
    type: 'column-chart-stacked',
    dataMapping: {
        categoryKey: [{ id: 'financials.period' }],
        valueKey: [{ id: 'revenue_total' }],
        legendKey: [{ id: 'companies.ticker' }],
    },
    format: {
        title: {
            enabled: true,
            text: 'Revenue',
        },
        subtitle: {
            enabled: true,
            text: 'By fiscal year and company',
        },
        style: {
            theme: {
                common: {
                    legend: {
                        enabled: true,
                    },
                },
            },
        },
    },
    sort: [
        {
            field: {
                id: 'financials.period',
            },
            direction: 'asc',
        },
    ],
});

/** The company report a drill-through opens, filtered to the chosen company. */
export const companyReportState: AgReportState<PeerGroupRegistry> = withoutCrossFilter({
    pages: [
        {
            id: 'company',
            widgets: {
                '1': {
                    type: 'text',
                    dataMapping: {
                        value: [
                            {
                                id: 'companies.description',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Company Profile',
                        },
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                            },
                            textAlign: 'left',
                            verticalAlign: 'top',
                            padding: true,
                        },
                    },
                },
                '4': {
                    type: 'text',
                    dataMapping: {},
                    format: {
                        title: {
                            enabled: true,
                            text: 'Key Statistics',
                        },
                        style: {
                            text: '',
                        },
                    },
                },
                '11': {
                    type: 'grid',
                    dataMapping: {
                        cols: [
                            {
                                id: 'companies.ticker',
                            },
                            {
                                id: 'companies.name',
                            },
                            {
                                id: 'company_metrics.marketCap',
                            },
                            {
                                id: 'company_metrics.peRatioTrailing',
                            },
                            {
                                id: 'company_metrics.revenueGrowthPct',
                            },
                            {
                                id: 'company_metrics.ebitdaMargin',
                            },
                            {
                                id: 'company_metrics.dividendYield',
                            },
                        ],
                    },
                    format: {
                        drillThrough: 'highlight',
                        title: {
                            enabled: true,
                            text: 'Peer Comparison',
                        },
                        style: {
                            grandTotalRow: {
                                enabled: false,
                            },
                            theme: {
                                rowHeight: 20,
                            },
                        },
                    },
                    sort: [
                        {
                            field: {
                                id: 'company_metrics.marketCap',
                            },
                            direction: 'desc',
                        },
                    ],
                },
                '12': {
                    type: 'analystConsensus',
                    dataMapping: {
                        targetPrice: [
                            {
                                id: 'price_targets.target',
                                aggregation: 'avg',
                            },
                        ],
                        lastClose: [
                            {
                                id: 'company_metrics.price',
                                aggregation: 'first',
                            },
                        ],
                        analystCount: [
                            {
                                id: 'price_targets.analystId',
                                aggregation: 'countd',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Analyst Consensus',
                        },
                    },
                },
                '15': {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'price_targets.target',
                                aggregation: 'avg',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Target (Avg)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                '17': {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'price_targets.target',
                                aggregation: 'max',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'High',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                '19': {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'price_targets.target',
                                aggregation: 'min',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Low',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                marketCap: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.marketCap',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Market Cap',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                peRatioTrailing: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.peRatioTrailing',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'P/E (TTM)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                peRatioForward: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.peRatioForward',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'P/E (Fwd)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                epsTrailing: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.epsTrailing',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'EPS (TTM)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                epsForward: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.epsForward',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'EPS (Fwd)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                dividendYield: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.dividendYield',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Div Yield',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                avgVolume3m: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.avgVolume3m',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Avg Vol (3m)',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                beta: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.beta',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Beta',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                price: {
                    type: 'area-chart',
                    dataMapping: {
                        categoryKey: [
                            {
                                id: 'price_history.date::month',
                            },
                        ],
                        valueKey: [
                            {
                                id: 'price_history.close',
                                aggregation: 'avg',
                            },
                        ],
                        tooltipKey: [
                            {
                                id: 'price_history.volume',
                                aggregation: 'sum',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Share Price',
                        },
                        subtitle: {
                            enabled: false,
                        },
                    },
                    sort: [
                        {
                            field: {
                                id: 'price_history.date::month',
                            },
                            direction: 'asc',
                        },
                    ],
                },
                financials: {
                    type: 'combo-chart-grouped-column-line',
                    dataMapping: {
                        categoryKey: [
                            {
                                id: 'financials.period',
                            },
                        ],
                        valueKey: [
                            {
                                id: 'revenue_total',
                            },
                            {
                                id: 'ebitda_total',
                            },
                        ],
                        secondaryValueKey: [
                            {
                                id: 'net_income_total',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Revenue & Earnings',
                        },
                        style: {
                            theme: {
                                common: {
                                    legend: {
                                        enabled: true,
                                    },
                                },
                            },
                        },
                        subtitle: {
                            enabled: false,
                        },
                    },
                    sort: [
                        {
                            field: {
                                id: 'financials.period',
                            },
                            direction: 'asc',
                        },
                    ],
                },
                segments: {
                    type: 'bar-chart-grouped',
                    dataMapping: {
                        categoryKey: [
                            {
                                id: 'segments.segment',
                            },
                        ],
                        valueKey: [
                            {
                                id: 'segments.revenue',
                                aggregation: 'sum',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Revenue by Segment',
                        },
                        subtitle: {
                            enabled: false,
                        },
                    },
                    sort: [
                        {
                            field: {
                                id: 'segments.revenue',
                                aggregation: 'sum',
                            },
                            direction: 'desc',
                        },
                    ],
                },
                financialSummary: {
                    type: 'grid',
                    dataMapping: {
                        cols: [
                            {
                                id: 'financials.period',
                            },
                            {
                                id: 'financials.revenue',
                            },
                            {
                                id: 'financials.revenueGrowthPct',
                            },
                            {
                                id: 'financials.ebitda',
                            },
                            {
                                id: 'financials.ebitdaMargin',
                            },
                            {
                                id: 'financials.netIncome',
                            },
                            {
                                id: 'financials.epsDiluted',
                            },
                        ],
                    },
                    format: {
                        title: {
                            enabled: true,
                            text: 'Financial Summary',
                        },
                        subtitle: {
                            enabled: false,
                        },
                        style: {
                            grandTotalRow: {
                                enabled: false,
                            },
                            theme: {
                                rowHeight: 20,
                            },
                        },
                    },
                    sort: [
                        {
                            field: {
                                id: 'financials.period',
                            },
                            direction: 'desc',
                        },
                    ],
                },
                revenueGrowth: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.revenueGrowthPct',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'Revenue Growth',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
                ebitdaMargin: {
                    type: 'value',
                    dataMapping: {
                        value: [
                            {
                                id: 'company_metrics.ebitdaMargin',
                                aggregation: 'first',
                            },
                        ],
                    },
                    format: {
                        style: {
                            typography: {
                                fontFamily: '"Source Sans 3", sans-serif',
                                fontSize: 14,
                                fontWeight: 'bold',
                                fontStyle: 'normal',
                            },
                            textAlign: 'justify',
                            label: {
                                enabled: true,
                                position: 'left',
                                text: 'EBITDA Margin',
                                typography: {
                                    fontFamily: '"Source Sans 3", sans-serif',
                                    fontSize: 11,
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                },
                            },
                        },
                    },
                },
            },
            widgetLayout: {
                '1': {
                    xTrack: 0,
                    yTrack: 0,
                    xSpan: 8,
                    ySpan: 10,
                },
                '4': {
                    xTrack: 0,
                    yTrack: 10,
                    xSpan: 8,
                    ySpan: 2,
                },
                '11': {
                    xTrack: 8,
                    yTrack: 14,
                    xSpan: 16,
                    ySpan: 13,
                },
                '12': {
                    xTrack: 0,
                    yTrack: 22,
                    xSpan: 8,
                    ySpan: 4,
                },
                '15': {
                    xTrack: 0,
                    yTrack: 26,
                    xSpan: 8,
                    ySpan: 2,
                },
                '17': {
                    xTrack: 0,
                    yTrack: 28,
                    xSpan: 8,
                    ySpan: 2,
                },
                '19': {
                    xTrack: 0,
                    yTrack: 30,
                    xSpan: 8,
                    ySpan: 2,
                },
                marketCap: {
                    xTrack: 0,
                    yTrack: 12,
                    xSpan: 4,
                    ySpan: 2,
                },
                peRatioTrailing: {
                    xTrack: 4,
                    yTrack: 12,
                    xSpan: 4,
                    ySpan: 2,
                },
                peRatioForward: {
                    xTrack: 0,
                    yTrack: 14,
                    xSpan: 4,
                    ySpan: 2,
                },
                epsTrailing: {
                    xTrack: 4,
                    yTrack: 14,
                    xSpan: 4,
                    ySpan: 2,
                },
                epsForward: {
                    xTrack: 0,
                    yTrack: 16,
                    xSpan: 4,
                    ySpan: 2,
                },
                dividendYield: {
                    xTrack: 4,
                    yTrack: 16,
                    xSpan: 4,
                    ySpan: 2,
                },
                avgVolume3m: {
                    xTrack: 0,
                    yTrack: 20,
                    xSpan: 4,
                    ySpan: 2,
                },
                beta: {
                    xTrack: 4,
                    yTrack: 20,
                    xSpan: 4,
                    ySpan: 2,
                },
                price: {
                    xTrack: 8,
                    yTrack: 0,
                    xSpan: 8,
                    ySpan: 14,
                },
                financials: {
                    xTrack: 16,
                    yTrack: 0,
                    xSpan: 8,
                    ySpan: 14,
                },
                segments: {
                    xTrack: 0,
                    yTrack: 32,
                    xSpan: 8,
                    ySpan: 10,
                },
                financialSummary: {
                    xTrack: 8,
                    yTrack: 27,
                    xSpan: 16,
                    ySpan: 15,
                },
                revenueGrowth: {
                    xTrack: 0,
                    yTrack: 18,
                    xSpan: 4,
                    ySpan: 2,
                },
                ebitdaMargin: {
                    xTrack: 4,
                    yTrack: 18,
                    xSpan: 4,
                    ySpan: 2,
                },
            },
            // Fluid width (an explicit 0, as a missing key falls back to the theme's); the fixed 692px
            // is the A4 page's 794px less the host's masthead and footer, as rows never stretch.
            layout: {
                minWidth: 0,
                height: 692,
                rowHeight: 16,
                pagePadding: 10,
            },
        },
    ],
    selectedPageId: 'company',
});
