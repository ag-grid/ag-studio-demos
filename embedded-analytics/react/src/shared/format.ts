// Number formatting for the host's own HTML, which is the demo's and so shared by every variant.

export const usd = (value: number) =>
    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const pct = (value: number, dp = 1) => `${(value * 100).toFixed(dp)}%`;

export const signedUsd = (value: number) => `${value >= 0 ? '+' : '-'}${usd(Math.abs(value))}`;

export const signedPct = (value: number) => `${value >= 0 ? '+' : ''}${pct(value, 2)}`;

export const billions = (value: number) => `$${(value / 1e9).toFixed(1)}B`;
