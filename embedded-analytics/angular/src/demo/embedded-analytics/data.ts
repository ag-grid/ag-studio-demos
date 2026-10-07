import type {
    AgCalendar,
    AgDataSourcesDefinition,
    AgExpressionFieldDefinition,
    AgFieldDefinition,
    AgRelationDefinition,
} from 'ag-studio';

// =============================================================================
// Halvyn Robotics (NYSE: HLVN) — fictional company tear-sheet data
//
// A mid-cap industrial-technology company (precision automation & robotics),
// founded 2005, listed on the NYSE in 2018. All figures are synthetic and
// generated deterministically from a fixed seed — no real market data. The
// schema below is the ticket deliverable; the generator gives the two embedded
// charts believable, internally consistent numbers to render.
// =============================================================================

// -----------------------------------------------------------------------------
// Schema — field definitions (the deliverable, per the ticket's six entities)
// -----------------------------------------------------------------------------

/** Fields describing the company itself (rendered as static tear-sheet content). */
export const companyProfileFields: AgFieldDefinition[] = [
    { id: 'name', name: 'Name', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'exchange', name: 'Exchange', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'sector', name: 'Sector', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'industry', name: 'Industry', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'description', name: 'Description', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'logoUrl', name: 'Logo URL', format: 'textFormat', cardinality: 'low', notBlank: false },
    { id: 'fiscalYearEnd', name: 'Fiscal Year End', format: 'textFormat', cardinality: 'low', notBlank: true },
];

/** Headline market statistics (rendered as the static key-stats grid). */
export const keyStatsFields: AgFieldDefinition[] = [
    { id: 'price', name: 'Price', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'changeAbs', name: 'Change', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'changePct', name: 'Change %', format: 'percentageFormat', cardinality: 'high', notBlank: true },
    { id: 'marketCap', name: 'Market Cap', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    {
        id: 'sharesOutstanding',
        name: 'Shares Outstanding',
        format: 'integerFormat',
        cardinality: 'high',
        notBlank: true,
    },
    { id: 'peRatioTrailing', name: 'P/E (TTM)', format: 'decimalFormat', cardinality: 'high', notBlank: true },
    { id: 'peRatioForward', name: 'P/E (Fwd)', format: 'decimalFormat', cardinality: 'high', notBlank: true },
    { id: 'epsTrailing', name: 'EPS (TTM)', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'epsForward', name: 'EPS (Fwd)', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'dividendYield', name: 'Dividend Yield', format: 'percentageFormat', cardinality: 'high', notBlank: true },
    { id: 'week52High', name: '52-Week High', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'week52Low', name: '52-Week Low', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'avgVolume3m', name: 'Avg Volume (3m)', format: 'integerFormat', cardinality: 'high', notBlank: true },
    { id: 'beta', name: 'Beta', format: 'decimalFormat', cardinality: 'high', notBlank: true },
];

/** Daily/periodic price series — feeds the embedded price chart. */
export const pricePointFields: AgFieldDefinition[] = [
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

/** Fiscal-period financials — feeds the embedded revenue/earnings chart. */
export const financialPeriodFields: AgFieldDefinition[] = [
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

/** Peer comparison rows (rendered as the static peers table). */
export const peerFields: AgFieldDefinition[] = [
    { id: 'ticker', name: 'Ticker', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'name', name: 'Name', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'marketCap', name: 'Market Cap', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'peRatioTrailing', name: 'P/E (TTM)', format: 'decimalFormat', cardinality: 'high', notBlank: true },
    { id: 'revenueGrowthPct', name: 'Revenue Growth', format: 'percentageFormat', cardinality: 'high', notBlank: true },
    { id: 'ebitdaMargin', name: 'EBITDA Margin', format: 'percentageFormat', cardinality: 'high', notBlank: true },
];

/** Revenue by product line — feeds the embedded segment-mix pie chart. */
export const segmentFields: AgFieldDefinition[] = [
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

/** Analyst consensus summary (rendered as static tear-sheet content). */
export const analystSummaryFields: AgFieldDefinition[] = [
    { id: 'rating', name: 'Rating', format: 'textFormat', cardinality: 'low', notBlank: true },
    { id: 'numAnalysts', name: 'Analysts', format: 'integerFormat', cardinality: 'medium', notBlank: true },
    { id: 'priceTargetAvg', name: 'Target (Avg)', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'priceTargetHigh', name: 'Target (High)', format: 'currencyFormat', cardinality: 'high', notBlank: true },
    { id: 'priceTargetLow', name: 'Target (Low)', format: 'currencyFormat', cardinality: 'high', notBlank: true },
];

// -----------------------------------------------------------------------------
// Row shapes for the generated series + static content
// -----------------------------------------------------------------------------

export interface PricePoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface FinancialPeriod {
    period: string;
    revenue: number;
    revenueGrowthPct: number;
    ebitda: number;
    ebitdaMargin: number;
    netIncome: number;
    epsBasic: number;
    epsDiluted: number;
}

export interface Peer {
    ticker: string;
    name: string;
    marketCap: number;
    peRatioTrailing: number;
    revenueGrowthPct: number;
    ebitdaMargin: number;
}

export interface Segment {
    segment: string;
    revenue: number;
}

export interface CompanyProfile {
    name: string;
    ticker: string;
    exchange: string;
    sector: string;
    industry: string;
    description: string;
    logoUrl: string;
    fiscalYearEnd: string;
}

export interface KeyStats {
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
}

export interface AnalystSummary {
    rating: string;
    numAnalysts: number;
    priceTargetAvg: number;
    priceTargetHigh: number;
    priceTargetLow: number;
}

export interface HalvynTearSheet {
    profile: CompanyProfile;
    keyStats: KeyStats;
    peers: Peer[];
    analyst: AnalystSummary;
    priceHistory: PricePoint[];
    financials: FinancialPeriod[];
    segments: Segment[];
}

// -----------------------------------------------------------------------------
// Generator — deterministic synthetic figures for a moderate-growth industrial
// -----------------------------------------------------------------------------

const SEED = 'halvyn-robotics';
const SHARES_OUTSTANDING = 62_400_000;
const IPO_YEAR = 2018;
const IPO_MONTH = 6; // June 2018 listing

// Round to `dp` decimal places, avoiding floating-point display noise.
function round(value: number, dp = 2): number {
    const factor = 10 ** dp;
    return Math.round(value * factor) / factor;
}

// Daily price walk (trading days only) from the IPO to today: mild upward drift
// with volatility, so the chart reads as a believable moderate-growth industrial.
function buildPriceHistory(rand: () => number, now: Date): PricePoint[] {
    const points: PricePoint[] = [];
    let close = 18; // IPO reference price

    const DAY_MS = 86_400_000;
    const start = Date.UTC(IPO_YEAR, IPO_MONTH - 1, 1);
    const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

    for (let t = start; t <= end; t += DAY_MS) {
        const d = new Date(t);
        const dow = d.getUTCDay();
        if (dow === 0 || dow === 6) continue; // trading days only (Mon–Fri)

        const open = close;
        const drift = 0.0005; // ~0.05% average daily appreciation
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
function buildFinancials(rand: () => number, now: Date): FinancialPeriod[] {
    const periods: FinancialPeriod[] = [];
    let revenue = 214_000_000; // FY2018 revenue base
    let prevRevenue = 0;

    const lastFullYear = now.getUTCFullYear() - 1;
    for (let y = IPO_YEAR; y <= lastFullYear; ++y) {
        if (y > IPO_YEAR) {
            const growth = 0.09 + rand() * 0.08; // 9–17% moderate growth
            prevRevenue = revenue;
            revenue = revenue * (1 + growth);
        }
        const revenueGrowthPct = prevRevenue > 0 ? revenue / prevRevenue - 1 : 0;
        const ebitdaMargin = 0.18 + rand() * 0.05; // 18–23%
        const ebitda = revenue * ebitdaMargin;
        const netIncome = ebitda * (0.5 + rand() * 0.12); // after D&A, interest, tax
        const epsDiluted = netIncome / SHARES_OUTSTANDING;
        const epsBasic = netIncome / (SHARES_OUTSTANDING * 0.97);

        periods.push({
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

const PEERS: Array<Omit<Peer, 'marketCap' | 'peRatioTrailing' | 'revenueGrowthPct' | 'ebitdaMargin'>> = [
    { ticker: 'VLTR', name: 'Valtora Motion Systems' },
    { ticker: 'HXRB', name: 'Helixor Robotics' },
    { ticker: 'PRCS', name: 'Precixon Industrial' },
    { ticker: 'NVMC', name: 'Novamech Controls' },
    { ticker: 'KNTQ', name: 'Kinetiq Automation' },
];

function buildPeers(rand: () => number): Peer[] {
    return PEERS.map((peer) => ({
        ...peer,
        marketCap: Math.round((1.2 + rand() * 4.6) * 1_000_000_000),
        peRatioTrailing: round(16 + rand() * 20, 1),
        revenueGrowthPct: round(0.04 + rand() * 0.16, 4),
        ebitdaMargin: round(0.15 + rand() * 0.12, 4),
    }));
}

// Latest-year revenue split across the company's three product lines.
function buildSegments(rand: () => number, latestRevenue: number): Segment[] {
    const lines: Array<{ segment: string; base: number }> = [
        { segment: 'Motion Control', base: 0.44 },
        { segment: 'Robotic Arms', base: 0.34 },
        { segment: 'Machine Vision', base: 0.22 },
    ];
    const weights = lines.map((l) => l.base + (rand() - 0.5) * 0.04);
    const total = weights.reduce((sum, w) => sum + w, 0);
    return lines.map((l, i) => ({
        segment: l.segment,
        revenue: Math.round((latestRevenue * weights[i]) / total),
    }));
}

function defaultRand(): () => number {
    // Fallback deterministic PRNG (mulberry32) when no seedrandom factory is passed.
    let a = 0x9e3779b9;
    for (let i = 0; i < SEED.length; ++i) a = (a ^ SEED.charCodeAt(i)) >>> 0;
    return function next() {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Builds the full deterministic tear sheet: the two chart series plus the
 * derived, internally consistent static content (profile, key stats, peers,
 * analyst summary). `createRng` mirrors the main demo's seedrandom injection;
 * when omitted a built-in PRNG is used so the numbers are still deterministic.
 */
export function getHalvynTearSheet(
    createRng?: (seed: string) => () => number,
    now: Date = new Date()
): HalvynTearSheet {
    const rand = createRng ? createRng(SEED) : defaultRand();

    const priceHistory = buildPriceHistory(rand, now);
    const financials = buildFinancials(rand, now);
    const peers = buildPeers(rand);

    const last = priceHistory[priceHistory.length - 1];
    const prev = priceHistory[priceHistory.length - 2] ?? last;
    const t52 = priceHistory.slice(-252); // ~one year of trading days
    const t3m = priceHistory.slice(-63); // ~three months of trading days
    const latestFy = financials[financials.length - 1];
    const segments = buildSegments(rand, latestFy.revenue);

    const epsTrailing = latestFy.epsDiluted;
    const epsForward = round(epsTrailing * 1.12);
    const price = last.close;

    const keyStats: KeyStats = {
        price,
        changeAbs: round(price - prev.close),
        changePct: round((price - prev.close) / prev.close, 4),
        marketCap: Math.round(price * SHARES_OUTSTANDING),
        sharesOutstanding: SHARES_OUTSTANDING,
        peRatioTrailing: round(price / epsTrailing, 1),
        peRatioForward: round(price / epsForward, 1),
        epsTrailing,
        epsForward,
        dividendYield: 0.006,
        week52High: round(Math.max(...t52.map((p) => p.high))),
        week52Low: round(Math.min(...t52.map((p) => p.low))),
        avgVolume3m: Math.round(t3m.reduce((sum, p) => sum + p.volume, 0) / Math.max(1, t3m.length)),
        beta: 1.24,
    };

    const priceTargetAvg = round(price * 1.14);
    const analyst: AnalystSummary = {
        rating: 'Overweight',
        numAnalysts: 11,
        priceTargetAvg,
        priceTargetHigh: round(priceTargetAvg * 1.18),
        priceTargetLow: round(priceTargetAvg * 0.82),
    };

    const profile: CompanyProfile = {
        name: 'Halvyn Robotics, Inc.',
        ticker: 'HLVN',
        exchange: 'NYSE',
        sector: 'Industrials',
        industry: 'Automation & Robotics Components',
        description:
            'Halvyn Robotics designs and manufactures precision automation and robotics components for manufacturing and logistics customers, spanning motion control systems, robotic arms, and machine-vision modules. Founded in 2005 and headquartered in the US, it has traded on the NYSE since 2018.',
        logoUrl: '',
        fiscalYearEnd: 'December',
    };

    return { profile, keyStats, peers, analyst, priceHistory, financials, segments };
}

// -----------------------------------------------------------------------------
// Data engine sources — the chart series fed to the embedded Studio instances
// -----------------------------------------------------------------------------

// A daily calendar so the daily price rows join, while the price series groups on
// the `month` fragment (time charts group on a calendar fragment, not the raw
// date column).
const halvynCalendar: AgCalendar = {
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
        source: { tableId: 'price_history', fieldId: 'date' },
        target: { calendarId: 'calendar' },
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

/** Data-source definition for the embedded charts (shared across instances). */
export function getHalvynData(createRng?: (seed: string) => () => number): AgDataSourcesDefinition {
    const { priceHistory, financials, segments } = getHalvynTearSheet(createRng);
    return {
        sources: [
            {
                id: 'price_history',
                name: 'Price History',
                dataShape: 'row',
                tables: [{ id: 'price_history', name: 'Price History', fields: pricePointFields }],
                getData: () => Promise.resolve({ data: priceHistory }),
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
        expressions: financialsMeasures,
        calendars: [halvynCalendar],
    };
}
