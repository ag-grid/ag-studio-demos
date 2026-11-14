/** Abbreviates large axis numbers, which raw AG Charts options do not do but Studio's charts do. */
export const abbreviate = (value: unknown): string => {
    const n = Number(value);
    if (!Number.isFinite(n)) {
        return String(value);
    }
    const abs = Math.abs(n);
    if (abs >= 1_000_000) {
        return `${trim(n / 1_000_000)}M`;
    }
    if (abs >= 1_000) {
        return `${trim(n / 1_000)}K`;
    }
    return trim(n);
};

/** One decimal place, but only when it carries information: 1.5K, not 20.0K. */
const trim = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

export const abbreviatedAxisLabel = { formatter: ({ value }: { value: unknown }): string => abbreviate(value) };
