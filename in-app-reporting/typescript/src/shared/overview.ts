import type { PeerGroup } from './data';
import { billions, pct } from './format';

/**
 * The overview page's own figures, formatted once and shared by the framework variants.
 *
 * The page around the embedded widgets is the host application's - a research note that happens to
 * have Studio widgets in it - so its content is the demo's, not a variant's. How it is rendered is
 * each variant's own business.
 */

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

export interface OverviewStat {
    label: string;
    value: string;
}

export interface OverviewCompany {
    ticker: string;
    name: string;
    logoUrl: string;
}

export interface OverviewView {
    title: string;
    description: string;
    /** Headline figures for the whole group, in reading order. */
    stats: OverviewStat[];
    companies: OverviewCompany[];
}

export function buildOverviewView({ companies, companyMetrics }: PeerGroup): OverviewView {
    return {
        title: 'Automation & Robotics Peer Group',
        description:
            'Six listed industrial automation companies, compared on valuation, growth and profitability. Right-click a company in any chart or table to open its report.',
        stats: [
            { label: 'Companies', value: String(companies.length) },
            {
                label: 'Market Cap',
                value: billions(companyMetrics.reduce((sum, metrics) => sum + metrics.marketCap, 0)),
            },
            { label: 'Avg P/E (TTM)', value: average(companyMetrics.map((m) => m.peRatioTrailing)).toFixed(1) },
            { label: 'Avg Revenue Growth', value: pct(average(companyMetrics.map((m) => m.revenueGrowthPct))) },
            { label: 'Avg EBITDA Margin', value: pct(average(companyMetrics.map((m) => m.ebitdaMargin))) },
            { label: 'Avg Dividend Yield', value: pct(average(companyMetrics.map((m) => m.dividendYield)), 2) },
        ],
        companies: companies.map(({ ticker, name, logoUrl }) => ({ ticker, name, logoUrl })),
    };
}

export const DISCLAIMER = 'All companies and figures are fictional and for demonstration only, not investment advice.';
