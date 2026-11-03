import type {
    AgCalendar,
    AgDataSourcesDefinition,
    AgExpressionFieldDefinition,
    AgFieldDefinition,
    AgRelationDefinition,
} from 'ag-studio';

import { getLogoUrl } from './logos';

// Six fictional listed automation companies. Every fact table carries a
// `ticker` column joining to the `companies` table.

/** The company dimension - one row per listed company, HLVN and its five peers. */
export const companyFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'name', name: 'Name', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'exchange', name: 'Exchange', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'sector', name: 'Sector', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'industry', name: 'Industry', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'description', name: 'Description', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'logoUrl', name: 'Logo URL', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'fiscalYearEnd', name: 'Fiscal Year End', format: 'textFormat', cardinality: 'low', notBlank: true },
];

/** Headline valuation metrics - one row per company, joined to `companies` by ticker. */
export const companyMetricsFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    {
        id: 'price',
        name: 'Price',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'changeAbs',
        name: 'Change',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'changePct',
        name: 'Change %',
        format: 'percentageFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '+#,##0.00%;-#,##0.00%' },
    },
    {
        id: 'marketCap',
        name: 'Market Cap',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.0,,,"B"' },
    },
    {
        id: 'sharesOutstanding',
        name: 'Shares Outstanding',
        format: 'integerFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0' },
    },
    { id: 'peRatioTrailing', name: 'P/E (TTM)', format: 'decimalFormat', cardinality: 'medium', notBlank: true },
    { id: 'peRatioForward', name: 'P/E (Fwd)', format: 'decimalFormat', cardinality: 'medium', notBlank: true },
    {
        id: 'epsTrailing',
        name: 'EPS (TTM)',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'epsForward',
        name: 'EPS (Fwd)',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'dividendYield',
        name: 'Dividend Yield',
        format: 'percentageFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0.00%' },
    },
    {
        id: 'week52High',
        name: '52-Week High',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'week52Low',
        name: '52-Week Low',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'avgVolume3m',
        name: 'Avg Volume (3m)',
        format: 'integerFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0' },
    },
    { id: 'beta', name: 'Beta', format: 'decimalFormat', cardinality: 'medium', notBlank: true },
    {
        id: 'revenueGrowthPct',
        name: 'Revenue Growth',
        format: 'percentageFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'ebitdaMargin',
        name: 'EBITDA Margin',
        format: 'percentageFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '#,##0.0%' },
    },
];

/** Daily/periodic price series - feeds the embedded price chart. */
export const pricePointFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'date', name: 'Date', format: 'dateFormat', cardinality: 'high', notBlank: true },
    {
        id: 'open',
        name: 'Open',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'high',
        name: 'High',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'low',
        name: 'Low',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'close',
        name: 'Close',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'volume',
        name: 'Volume',
        format: 'integerFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '#,##0' },
    },
];

/** Fiscal-period financials - feeds the embedded revenue/earnings chart. */
export const financialPeriodFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'period', name: 'Period', format: 'textFormat', cardinality: 'medium', notBlank: true },
    {
        id: 'revenue',
        name: 'Revenue',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.0,,"M"' },
    },
    {
        id: 'revenueGrowthPct',
        name: 'Revenue Growth',
        format: 'percentageFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'ebitda',
        name: 'EBITDA',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.0,,"M"' },
    },
    {
        id: 'ebitdaMargin',
        name: 'EBITDA Margin',
        format: 'percentageFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'netIncome',
        name: 'Net Income',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.0,,"M"' },
    },
    {
        id: 'epsBasic',
        name: 'EPS (Basic)',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
    {
        id: 'epsDiluted',
        name: 'EPS (Diluted)',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
];

/** One analyst's price target - several rows per company. */
export const priceTargetFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'analystId', name: 'Analyst', format: 'textFormat', cardinality: 'medium', notBlank: true },
    {
        id: 'target',
        name: 'Price Target',
        format: 'currencyFormat',
        cardinality: 'high',
        notBlank: true,
        formatOptions: { format: '$#,##0.00' },
    },
];

/** Revenue by product line - feeds the embedded segment-mix pie chart. */
export const segmentFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'segment', name: 'Segment', format: 'textFormat', cardinality: 'low', notBlank: true },
    {
        id: 'revenue',
        name: 'Revenue',
        format: 'currencyFormat',
        cardinality: 'medium',
        notBlank: true,
        formatOptions: { format: '$#,##0.0,,"M"' },
    },
];

// Row shapes for the generated rows

export interface PricePoint {
    ticker: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface FinancialPeriod {
    ticker: string;
    period: string;
    revenue: number;
    revenueGrowthPct: number;
    ebitda: number;
    ebitdaMargin: number;
    netIncome: number;
    epsBasic: number;
    epsDiluted: number;
}

export interface PriceTarget {
    ticker: string;
    analystId: string;
    target: number;
}

export interface Segment {
    ticker: string;
    segment: string;
    revenue: number;
}

/** A row of the `companies` dimension: what the company is. */
export interface Company {
    ticker: string;
    name: string;
    exchange: string;
    sector: string;
    industry: string;
    description: string;
    logoUrl: string;
    fiscalYearEnd: string;
}

/** A row of the `company_metrics` table: what the company is currently worth. */
export interface CompanyMetrics {
    ticker: string;
    price: number;
    changeAbs: number;
    changePct: number;
    marketCap: number;
    sharesOutstanding: number;
    peRatioTrailing: number;
    peRatioForward: number;
    epsTrailing: number;
    epsForward: number;
    dividendYield: number;
    week52High: number;
    week52Low: number;
    avgVolume3m: number;
    beta: number;
    revenueGrowthPct: number;
    ebitdaMargin: number;
}

/** The whole peer group: the company dimension plus every company's fact rows. */
export interface PeerGroup {
    companies: Company[];
    companyMetrics: CompanyMetrics[];
    priceHistory: PricePoint[];
    priceTargets: PriceTarget[];
    financials: FinancialPeriod[];
    segments: Segment[];
}

// Generator - deterministic synthetic figures for a peer group of industrials

const SEED = 'halvyn-robotics';

const HALVYN_TICKER = 'HLVN';

const TRADING_DAYS_PER_YEAR = 252;
const TRADING_DAYS_PER_QUARTER = 63;

/** Forward EPS as a multiple of trailing EPS. */
const FORWARD_EPS_GROWTH = 1.12;

/** The three product lines every company in the group reports against. */
const SEGMENT_LINES = ['Motion Control', 'Robotic Arms', 'Machine Vision'] as const;

/** The fixed inputs each company's synthetic history is generated from. */
interface CompanySeed {
    ticker: string;
    name: string;
    exchange: string;
    industry: string;
    description: string;
    listingYear: number;
    listingMonth: number;
    listingPrice: number;
    sharesOutstanding: number;
    revenueBase: number;
    /** Average daily price appreciation, as a fraction. */
    drift: number;
    dividendYield: number;
    beta: number;
    /** How many analysts publish a price target for this company. */
    numAnalysts: number;
    /** Consensus price target as a multiple of the last close. */
    consensusUpside: number;
    /** Revenue share of each entry in `SEGMENT_LINES`, before jitter. */
    segmentMix: [number, number, number];
}

const SECTOR = 'Industrials';
const FISCAL_YEAR_END = 'December';

const COMPANY_SEEDS: CompanySeed[] = [
    {
        ticker: HALVYN_TICKER,
        name: 'Halvyn Robotics, Inc.',
        exchange: 'NYSE',
        industry: 'Automation & Robotics Components',
        description:
            'Halvyn Robotics designs and manufactures precision automation and robotics components for manufacturing and logistics customers, spanning motion control systems, robotic arms, and machine-vision modules. Founded in 2005 and headquartered in the US, it has traded on the NYSE since 2018.',
        listingYear: 2018,
        listingMonth: 6,
        listingPrice: 18,
        sharesOutstanding: 62_400_000,
        revenueBase: 214_000_000,
        drift: 0.0005,
        dividendYield: 0.006,
        beta: 1.24,
        numAnalysts: 11,
        consensusUpside: 1.14,
        segmentMix: [0.44, 0.34, 0.22],
    },
    {
        ticker: 'VLTR',
        name: 'Valtora Motion Systems',
        exchange: 'NYSE',
        industry: 'Motion Control Systems',
        description:
            'Valtora Motion Systems supplies servo drives, linear actuators and motion controllers to automotive and general industrial manufacturers.',
        listingYear: 2018,
        listingMonth: 1,
        listingPrice: 24,
        sharesOutstanding: 88_200_000,
        revenueBase: 341_000_000,
        drift: 0.00038,
        dividendYield: 0.011,
        beta: 1.08,
        numAnalysts: 14,
        consensusUpside: 1.02,
        segmentMix: [0.62, 0.21, 0.17],
    },
    {
        ticker: 'HXRB',
        name: 'Helixor Robotics',
        exchange: 'NASDAQ',
        industry: 'Industrial Robotics',
        description:
            'Helixor Robotics builds collaborative and articulated robotic arms for electronics assembly and warehouse automation.',
        listingYear: 2019,
        listingMonth: 3,
        listingPrice: 12,
        sharesOutstanding: 45_700_000,
        revenueBase: 128_000_000,
        drift: 0.00072,
        dividendYield: 0,
        beta: 1.52,
        numAnalysts: 8,
        consensusUpside: 1.21,
        segmentMix: [0.18, 0.64, 0.18],
    },
    {
        ticker: 'PRCS',
        name: 'Precixon Industrial',
        exchange: 'NYSE',
        industry: 'Precision Components',
        description:
            'Precixon Industrial machines precision bearings, gearing and positioning stages sold into automation OEMs worldwide.',
        listingYear: 2018,
        listingMonth: 9,
        listingPrice: 31,
        sharesOutstanding: 104_500_000,
        revenueBase: 472_000_000,
        drift: 0.00026,
        dividendYield: 0.018,
        beta: 0.92,
        numAnalysts: 17,
        consensusUpside: 0.88,
        segmentMix: [0.51, 0.28, 0.21],
    },
    {
        ticker: 'NVMC',
        name: 'Novamech Controls',
        exchange: 'NASDAQ',
        industry: 'Automation & Robotics Components',
        description:
            'Novamech Controls develops programmable controllers and edge software that co-ordinate robotic cells on the factory floor.',
        listingYear: 2020,
        listingMonth: 2,
        listingPrice: 15,
        sharesOutstanding: 51_300_000,
        revenueBase: 96_000_000,
        drift: 0.00081,
        dividendYield: 0,
        beta: 1.61,
        numAnalysts: 6,
        consensusUpside: 1.09,
        segmentMix: [0.37, 0.24, 0.39],
    },
    {
        ticker: 'KNTQ',
        name: 'Kinetiq Automation',
        exchange: 'NASDAQ',
        industry: 'Machine Vision',
        description:
            'Kinetiq Automation supplies machine-vision cameras, lighting and inspection software for high-speed production lines.',
        listingYear: 2019,
        listingMonth: 7,
        listingPrice: 21,
        sharesOutstanding: 39_800_000,
        revenueBase: 167_000_000,
        drift: 0.00054,
        dividendYield: 0.004,
        beta: 1.35,
        numAnalysts: 9,
        consensusUpside: 0.97,
        segmentMix: [0.14, 0.19, 0.67],
    },
];

// Round to `dp` decimal places, avoiding floating-point display noise.
function round(value: number, dp = 2): number {
    const factor = 10 ** dp;
    return Math.round(value * factor) / factor;
}

// Daily price walk (trading days only) from the listing to today: mild upward
// drift with volatility, so the chart reads as a believable industrial name.
function buildPriceHistory(seed: CompanySeed, rand: () => number, now: Date): PricePoint[] {
    const { ticker, listingYear, listingMonth, listingPrice, drift } = seed;
    const points: PricePoint[] = [];
    let close = listingPrice;

    const DAY_MS = 86_400_000;
    const start = Date.UTC(listingYear, listingMonth - 1, 1);
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    for (let t = start; t <= end; t += DAY_MS) {
        const d = new Date(t);
        const dow = d.getUTCDay();
        if (dow === 0 || dow === 6) continue; // trading days only (Mon-Fri)

        const open = close;
        const shock = (rand() - 0.5) * 0.03; // day-to-day volatility
        close = Math.max(4, open * (1 + drift + shock));

        const swing = open * (0.005 + rand() * 0.02);
        const high = Math.max(open, close) + swing * rand();
        const low = Math.min(open, close) - swing * rand();
        const volume = Math.round(700_000 + rand() * 2_200_000);

        const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
            d.getUTCDate()
        ).padStart(2, '0')}`;
        points.push({
            ticker,
            date: iso,
            open: round(open),
            high: round(high),
            low: round(Math.max(1, low)),
            close: round(close),
            volume,
        });
    }
    return points;
}

// Fiscal-year financials (calendar-year end) from listing to the last full year.
function buildFinancials(seed: CompanySeed, rand: () => number, now: Date): FinancialPeriod[] {
    const { ticker, listingYear, revenueBase, sharesOutstanding } = seed;
    const periods: FinancialPeriod[] = [];
    let revenue = revenueBase;
    let prevRevenue = 0;

    const lastFullYear = now.getUTCFullYear() - 1;
    for (let y = listingYear; y <= lastFullYear; ++y) {
        if (y > listingYear) {
            const growth = 0.09 + rand() * 0.08; // 9-17% moderate growth
            prevRevenue = revenue;
            revenue = revenue * (1 + growth);
        }
        const revenueGrowthPct = prevRevenue > 0 ? revenue / prevRevenue - 1 : 0;
        const ebitdaMargin = 0.18 + rand() * 0.05; // 18-23%
        const ebitda = revenue * ebitdaMargin;
        const netIncome = ebitda * (0.5 + rand() * 0.12); // after D&A, interest, tax
        const epsDiluted = netIncome / sharesOutstanding;
        const epsBasic = netIncome / (sharesOutstanding * 0.97);

        periods.push({
            ticker,
            period: `FY${y}`,
            revenue: Math.round(revenue),
            revenueGrowthPct: round(revenueGrowthPct, 4),
            ebitda: Math.round(ebitda),
            ebitdaMargin: round(ebitdaMargin, 4),
            netIncome: Math.round(netIncome),
            epsBasic: round(epsBasic),
            epsDiluted: round(epsDiluted),
        });
    }
    return periods;
}

// Re-centred on `centre` so the rows average to it exactly, not approximately.
function buildPriceTargets(seed: CompanySeed, rand: () => number, centre: number): PriceTarget[] {
    const { ticker, numAnalysts } = seed;
    const offsets = Array.from({ length: numAnalysts }, () => (rand() - 0.5) * 0.36);
    const mean = offsets.reduce((sum, o) => sum + o, 0) / numAnalysts;
    return offsets.map((offset, i) => ({
        ticker,
        analystId: `${ticker}-A${String(i + 1).padStart(2, '0')}`,
        target: round(centre * (1 + offset - mean)),
    }));
}

// Latest-year revenue split across the company's three product lines.
function buildSegments(seed: CompanySeed, rand: () => number, latestRevenue: number): Segment[] {
    const weights = seed.segmentMix.map((base) => base + (rand() - 0.5) * 0.04);
    const total = weights.reduce((sum, w) => sum + w, 0);
    return SEGMENT_LINES.map((segment, i) => ({
        ticker: seed.ticker,
        segment,
        revenue: Math.round((latestRevenue * weights[i]) / total),
    }));
}

function defaultRand(seed: string): () => number {
    // mulberry32
    let a = 0x9e3779b9;
    for (let i = 0; i < seed.length; ++i) a = (a ^ seed.charCodeAt(i)) >>> 0;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Builds the whole peer group: the `companies` dimension and its metrics, plus
 * every company's price, financial and segment rows. Each company draws from its
 * own seeded stream, so adding or reordering a company leaves the others alone.
 */
export function getPeerGroup(now: Date = new Date()): PeerGroup {
    const companies: Company[] = [];
    const companyMetrics: CompanyMetrics[] = [];
    const priceHistory: PricePoint[] = [];
    const priceTargets: PriceTarget[] = [];
    const financials: FinancialPeriod[] = [];
    const segments: Segment[] = [];

    for (const seed of COMPANY_SEEDS) {
        const companySeed = `${SEED}-${seed.ticker}`;
        const rand = defaultRand(companySeed);

        const prices = buildPriceHistory(seed, rand, now);
        const periods = buildFinancials(seed, rand, now);
        const latestFy = periods[periods.length - 1];
        const lines = buildSegments(seed, rand, latestFy.revenue);

        const last = prices[prices.length - 1];
        const prev = prices[prices.length - 2] ?? last;
        const price = last.close;
        const epsTrailing = latestFy.epsDiluted;
        const epsForward = round(epsTrailing * FORWARD_EPS_GROWTH);
        const t52 = prices.slice(-TRADING_DAYS_PER_YEAR);
        const t3m = prices.slice(-TRADING_DAYS_PER_QUARTER);
        const targets = buildPriceTargets(seed, rand, round(price * seed.consensusUpside));
        companies.push({
            ticker: seed.ticker,
            name: seed.name,
            exchange: seed.exchange,
            sector: SECTOR,
            industry: seed.industry,
            description: seed.description,
            logoUrl: getLogoUrl(seed.ticker),
            fiscalYearEnd: FISCAL_YEAR_END,
        });
        companyMetrics.push({
            ticker: seed.ticker,
            price,
            changeAbs: round(price - prev.close),
            changePct: round((price - prev.close) / prev.close, 4),
            marketCap: Math.round(price * seed.sharesOutstanding),
            sharesOutstanding: seed.sharesOutstanding,
            peRatioTrailing: round(price / epsTrailing, 1),
            peRatioForward: round(price / epsForward, 1),
            epsTrailing,
            epsForward,
            dividendYield: seed.dividendYield,
            week52High: round(Math.max(...t52.map((p) => p.high))),
            week52Low: round(Math.min(...t52.map((p) => p.low))),
            avgVolume3m: Math.round(t3m.reduce((sum, p) => sum + p.volume, 0) / Math.max(1, t3m.length)),
            beta: seed.beta,
            revenueGrowthPct: latestFy.revenueGrowthPct,
            ebitdaMargin: latestFy.ebitdaMargin,
        });

        priceHistory.push(...prices);
        priceTargets.push(...targets);
        financials.push(...periods);
        segments.push(...lines);
    }

    return { companies, companyMetrics, priceHistory, priceTargets, financials, segments };
}

// Data engine sources

// Time charts group on a calendar fragment, not the raw date column.
const peerGroupCalendar: AgCalendar = {
    id: 'calendar',
    label: 'Calendar',
    range: {
        from: { literal: '2018-01-01' },
        to: { operator: 'currentDate', inputs: [] },
    },
    fragments: ['year', 'quarter', { unit: 'month', format: 'MMM yyyy' }, 'week', 'day'],
};

const relationships: AgRelationDefinition[] = [
    {
        id: 'price-calendar',
        source: 'price_history.date',
        target: { calendarId: 'calendar' },
    },
    {
        id: 'metrics-company',
        source: 'company_metrics.ticker',
        target: 'companies.ticker',
        type: 'one-to-one',
    },
    {
        id: 'targets-company',
        source: 'price_targets.ticker',
        target: 'companies.ticker',
        type: 'many-to-one',
    },
    {
        id: 'price-company',
        source: 'price_history.ticker',
        target: 'companies.ticker',
        type: 'many-to-one',
    },
    {
        id: 'financials-company',
        source: 'financials.ticker',
        target: 'companies.ticker',
        type: 'many-to-one',
    },
    {
        id: 'segments-company',
        source: 'segments.ticker',
        target: 'companies.ticker',
        type: 'many-to-one',
    },
];

// Named measures so the Revenue & Earnings chart legend reads "Revenue / EBITDA /
// Net Income" rather than "Revenue (sum)…", keeping the legend compact.
const MONEY_M = { format: '$#,##0.0,,"M"' };
const financialsMeasures: AgExpressionFieldDefinition[] = [
    {
        id: 'revenue_total',
        name: 'Revenue',
        isMeasure: true,
        expression: { id: 'financials.revenue', aggregation: 'sum' },
        format: 'currencyFormat',
        formatOptions: MONEY_M,
    },
    {
        id: 'ebitda_total',
        name: 'EBITDA',
        isMeasure: true,
        expression: { id: 'financials.ebitda', aggregation: 'sum' },
        format: 'currencyFormat',
        formatOptions: MONEY_M,
    },
    {
        id: 'net_income_total',
        name: 'Net Income',
        isMeasure: true,
        expression: { id: 'financials.netIncome', aggregation: 'sum' },
        format: 'currencyFormat',
        formatOptions: MONEY_M,
    },
];

// Named measures so the overview's Group Metrics read "Companies / Market Cap / ..."
// rather than "Ticker (countd) / Market Cap (sum) / ...".
const peerGroupMeasures: AgExpressionFieldDefinition[] = [
    {
        id: 'company_count',
        name: 'Companies',
        isMeasure: true,
        expression: { id: 'companies.ticker', aggregation: 'countd' },
        format: 'integerFormat',
    },
    {
        id: 'group_market_cap',
        name: 'Market Cap',
        isMeasure: true,
        expression: { id: 'company_metrics.marketCap', aggregation: 'sum' },
        format: 'currencyFormat',
        formatOptions: { format: '$#,##0.0,,,"B"' },
    },
    {
        id: 'avg_pe_trailing',
        name: 'Avg P/E (TTM)',
        isMeasure: true,
        expression: { id: 'company_metrics.peRatioTrailing', aggregation: 'avg' },
        format: 'decimalFormat',
        formatOptions: { format: '#,##0.0' },
    },
    {
        id: 'avg_revenue_growth',
        name: 'Avg Revenue Growth',
        isMeasure: true,
        expression: { id: 'company_metrics.revenueGrowthPct', aggregation: 'avg' },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'avg_ebitda_margin',
        name: 'Avg EBITDA Margin',
        isMeasure: true,
        expression: { id: 'company_metrics.ebitdaMargin', aggregation: 'avg' },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.0%' },
    },
    {
        id: 'avg_dividend_yield',
        name: 'Avg Dividend Yield',
        isMeasure: true,
        expression: { id: 'company_metrics.dividendYield', aggregation: 'avg' },
        format: 'percentageFormat',
        formatOptions: { format: '#,##0.00%' },
    },
];

/** Data-source definition for the whole peer group. */
export function getPeerGroupData(group: PeerGroup = getPeerGroup()): AgDataSourcesDefinition {
    const { companies, companyMetrics, priceHistory, priceTargets, financials, segments } = group;
    return {
        sources: [
            {
                id: 'companies',
                name: 'Companies',
                dataShape: 'row',
                tables: [{ id: 'companies', name: 'Companies', fields: companyFields }],
                getData: () => Promise.resolve({ data: companies }),
            },
            {
                id: 'company_metrics',
                name: 'Company Metrics',
                dataShape: 'row',
                tables: [{ id: 'company_metrics', name: 'Company Metrics', fields: companyMetricsFields }],
                getData: () => Promise.resolve({ data: companyMetrics }),
            },
            {
                id: 'price_history',
                name: 'Price History',
                dataShape: 'row',
                tables: [{ id: 'price_history', name: 'Price History', fields: pricePointFields }],
                getData: () => Promise.resolve({ data: priceHistory }),
            },
            {
                id: 'price_targets',
                name: 'Price Targets',
                dataShape: 'row',
                tables: [{ id: 'price_targets', name: 'Price Targets', fields: priceTargetFields }],
                getData: () => Promise.resolve({ data: priceTargets }),
            },
            {
                id: 'financials',
                name: 'Financials',
                dataShape: 'row',
                tables: [{ id: 'financials', name: 'Financials', fields: financialPeriodFields }],
                getData: () => Promise.resolve({ data: financials }),
            },
            {
                id: 'segments',
                name: 'Segments',
                dataShape: 'row',
                tables: [{ id: 'segments', name: 'Segments', fields: segmentFields }],
                getData: () => Promise.resolve({ data: segments }),
            },
        ],
        relationships,
        expressions: [...financialsMeasures, ...peerGroupMeasures],
        calendars: [peerGroupCalendar],
    };
}
