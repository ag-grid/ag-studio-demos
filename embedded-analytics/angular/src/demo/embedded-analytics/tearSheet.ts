import { getHalvynTearSheet } from './data';

/**
 * The tear sheet's figures, formatted once and shared by the framework variants.
 *
 * The surrounding document is the host application in this demo - a research tear sheet that
 * happens to have Studio widgets embedded in it - so its content is the demo's, not a variant's.
 * How it is rendered is each variant's own business.
 */

const usd = (value: number, dp = 2) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const signedPct = (value: number) => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
const signedUsd = (value: number) => `${value >= 0 ? '+' : '−'}${usd(Math.abs(value))}`;
const int = (value: number) => value.toLocaleString('en-US');
const bn = (value: number) => (value >= 1e9 ? `$${(value / 1e9).toFixed(2)}B` : `$${(value / 1e6).toFixed(1)}M`);

export interface TearSheetStat {
    label: string;
    value: string;
}

export interface TearSheetPeer {
    ticker: string;
    marketCap: string;
    peRatio: string;
    revenueGrowth: string;
}

export interface TearSheetView {
    company: { name: string; exchange: string; ticker: string; industry: string; description: string };
    price: { now: string; change: string; changePct: string; isUp: boolean };
    /** Key-stats grid, in reading order. */
    stats: TearSheetStat[];
    analyst: { rating: string; numAnalysts: number; targetAvg: string; targetHigh: string; targetLow: string };
    /** Peer table, with the company itself first. */
    peers: TearSheetPeer[];
}

export function buildTearSheetView(): TearSheetView {
    const { profile, keyStats, peers, analyst, financials } = getHalvynTearSheet();
    const latestFy = financials[financials.length - 1];

    return {
        company: {
            name: profile.name,
            exchange: profile.exchange,
            ticker: profile.ticker,
            industry: profile.industry,
            description: profile.description,
        },
        price: {
            now: usd(keyStats.price),
            change: signedUsd(keyStats.changeAbs),
            changePct: signedPct(keyStats.changePct),
            isUp: keyStats.changeAbs >= 0,
        },
        stats: [
            { label: 'Market Cap', value: bn(keyStats.marketCap) },
            { label: 'P/E (TTM)', value: keyStats.peRatioTrailing.toFixed(1) },
            { label: 'P/E (Fwd)', value: keyStats.peRatioForward.toFixed(1) },
            { label: 'EPS (TTM)', value: usd(keyStats.epsTrailing) },
            { label: 'EPS (Fwd)', value: usd(keyStats.epsForward) },
            { label: 'Div Yield', value: pct(keyStats.dividendYield) },
            { label: '52W High', value: usd(keyStats.week52High) },
            { label: '52W Low', value: usd(keyStats.week52Low) },
            { label: 'Avg Vol (3m)', value: int(keyStats.avgVolume3m) },
            { label: 'Beta', value: keyStats.beta.toFixed(2) },
            { label: 'Shares Out.', value: `${(keyStats.sharesOutstanding / 1e6).toFixed(1)}M` },
            { label: 'Fiscal Year', value: profile.fiscalYearEnd },
        ],
        analyst: {
            rating: analyst.rating,
            numAnalysts: analyst.numAnalysts,
            targetAvg: usd(analyst.priceTargetAvg),
            targetHigh: usd(analyst.priceTargetHigh),
            targetLow: usd(analyst.priceTargetLow),
        },
        peers: [
            {
                ticker: profile.ticker,
                marketCap: bn(keyStats.marketCap),
                peRatio: keyStats.peRatioTrailing.toFixed(1),
                revenueGrowth: pct(latestFy.revenueGrowthPct),
            },
            ...peers.map((peer) => ({
                ticker: peer.ticker,
                marketCap: bn(peer.marketCap),
                peRatio: peer.peRatioTrailing.toFixed(1),
                revenueGrowth: pct(peer.revenueGrowthPct),
            })),
        ],
    };
}

export const DISCLAIMER =
    'Halvyn Robotics is a fictional company. All figures are synthetic and for demonstration only, not investment advice.';
