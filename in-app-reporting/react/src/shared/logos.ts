// Inlined rather than served, so a published starter needs no asset folder or host to show them.
const LOGO_SVGS: Record<string, string> = {
    HLVN: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Halvyn Robotics</title>
    <rect x="5" y="4" width="8" height="32" fill="#1b2a4a" />
    <rect x="27" y="4" width="8" height="32" fill="#1b2a4a" />
    <path d="M13 15 L27 22 V30 L13 23 Z" fill="#b08d57" />
</svg>`,
    HXRB: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Helixor Robotics</title>
    <path d="M10 5 C26 13, 26 27, 10 35" fill="none" stroke="#2d2a5e" stroke-width="5" stroke-linecap="round" />
    <path d="M30 5 C14 13, 14 27, 30 35" fill="none" stroke="#4fb3a0" stroke-width="5" stroke-linecap="round" />
</svg>`,
    KNTQ: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Kinetiq Automation</title>
    <circle cx="20" cy="20" r="15" fill="none" stroke="#3b2a4a" stroke-width="4" />
    <path d="M20 8 L31 26 L9 26 Z" fill="#3b2a4a" />
    <circle cx="20" cy="20" r="4" fill="#d4a82f" />
</svg>`,
    NVMC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Novamech Controls</title>
    <rect x="5" y="5" width="30" height="30" rx="6" fill="none" stroke="#14303a" stroke-width="4" />
    <rect x="13" y="13" width="6" height="6" fill="#14303a" />
    <rect x="21" y="13" width="6" height="6" fill="#14303a" />
    <rect x="13" y="21" width="6" height="6" fill="#14303a" />
    <rect x="21" y="21" width="6" height="6" fill="#5bc0a8" />
</svg>`,
    PRCS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Precixon Industrial</title>
    <circle cx="20" cy="20" r="15" fill="none" stroke="#33404d" stroke-width="4" />
    <circle cx="20" cy="20" r="8" fill="none" stroke="#33404d" stroke-width="3" />
    <circle cx="20" cy="20" r="3" fill="#c2453b" />
</svg>`,
    VLTR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" role="img">
    <title>Valtora Motion Systems</title>
    <path d="M5 6 L15 20 L5 34 L11 34 L21 20 L11 6 Z" fill="#1f3a5f" />
    <path d="M19 6 L29 20 L19 34 L25 34 L35 20 L25 6 Z" fill="#e08a3c" />
</svg>`,
};

/** The company's logo as a data URL, usable anywhere an image URL is. */
export function getLogoUrl(ticker: string): string {
    return `data:image/svg+xml,${encodeURIComponent(LOGO_SVGS[ticker] ?? '')}`;
}
