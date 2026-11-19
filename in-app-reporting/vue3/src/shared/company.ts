import type { PeerGroup } from './data';
import { signedPct, signedUsd, usd } from './format';

/**
 * The company report's masthead and footer, formatted once and shared by the framework variants.
 *
 * They are the host's HTML around the Studio report, so they can do what a widget cannot, such as
 * colour the day's move by its direction.
 */

export interface CompanyView {
    ticker: string;
    name: string;
    logoUrl: string;
    /** Listing, industry and sector, in one line under the name. */
    tagline: string;
    lastClose: string;
    /** E.g. "+$0.82 (+0.99%)". */
    change: string;
    direction: 'up' | 'down';
    range52w: {
        low: string;
        high: string;
        /** Where the last close sits in the range, from 0 at the low to 1 at the high. */
        position: number;
    };
}

export function buildCompanyView({ companies, companyMetrics }: PeerGroup, ticker: string): CompanyView | undefined {
    const company = companies.find((row) => row.ticker === ticker);
    const metrics = companyMetrics.find((row) => row.ticker === ticker);
    if (!company || !metrics) {
        return undefined;
    }
    const { price, changeAbs, changePct, week52Low, week52High } = metrics;
    return {
        ticker,
        name: company.name,
        logoUrl: company.logoUrl,
        tagline: `${company.exchange}: ${ticker} · ${company.industry} · ${company.sector}`,
        lastClose: usd(price),
        change: `${signedUsd(changeAbs)} (${signedPct(changePct)})`,
        direction: changeAbs >= 0 ? 'up' : 'down',
        range52w: {
            low: usd(week52Low),
            high: usd(week52High),
            position: week52High > week52Low ? (price - week52Low) / (week52High - week52Low) : 0.5,
        },
    };
}

/** The date the report's figures are as of, for its footer. */
export function formatAsOf(date: Date = new Date()): string {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
