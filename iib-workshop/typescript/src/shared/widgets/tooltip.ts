import type { AgTooltipRendererResult } from 'ag-charts-enterprise';

/** Structured rather than HTML, so values render as text and styling matches the built-in tooltips. */
export function tooltipContent(title: string, rows: [string, string][]): AgTooltipRendererResult {
    return { title, data: rows.map(([label, value]) => ({ label, value })) };
}
