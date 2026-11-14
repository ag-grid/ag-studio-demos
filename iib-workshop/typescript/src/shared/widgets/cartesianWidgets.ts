import type { AgChartOptions } from 'ag-charts-enterprise';
import type { AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';

import { IIB, fill } from '../theme';
import { abbreviatedAxisLabel } from './axisFormat';
import { ChartWidgetBase } from './chartWidgetBase';
import type { AnnotationsDef, ErrorBarsDef } from './types';

interface ErrorBarFields {
    x: AgWidgetField;
    mean: AgWidgetField;
    lower: AgWidgetField;
    upper: AgWidgetField;
}

/**
 * Bars with error bars. The whiskers are the observed min and max rather than a computed
 * deviation: the engine's aggregations are sum, avg, min, max, count, countd, first and
 * last, with no standard deviation among them.
 */
export class ErrorBarsWidget extends ChartWidgetBase<ErrorBarsDef, ErrorBarFields> {
    protected resolveFields(m: AgWidgetDataMapping<ErrorBarsDef>): ErrorBarFields | null {
        const x = m.x?.[0];
        const mean = m.mean?.[0];
        const lower = m.lower?.[0];
        const upper = m.upper?.[0];
        return x && mean && lower && upper ? { x, mean, lower, upper } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<ErrorBarsDef>,
        f: ErrorBarFields
    ): Promise<AgChartOptions | null> {
        const { results } = await widgetApi.getData({ fields: [f.x, f.mean, f.lower, f.upper] });
        if (!results.rows.length) {
            return null;
        }

        return {
            data: results.rows,
            series: [
                {
                    type: 'bar',
                    xKey: f.x.key,
                    yKey: f.mean.key,
                    errorBar: {
                        yLowerKey: f.lower.key,
                        yUpperKey: f.upper.key,
                        stroke: IIB.text,
                        strokeWidth: 1.5,
                        cap: { stroke: IIB.text, strokeWidth: 1.5, lengthRatio: 0.5 },
                    },
                },
            ],
            suppressFieldDotNotation: true,
        };
    }
}

// Drawn lines default to the axis label colour, hiding their value; teal stands apart. Functions,
// not constants, so a theme change is picked up.
const drawnLine = () => ({ stroke: fill(1), strokeWidth: 1.5 });
/** Only the cross-line styles carry an axis label; a free line has none. */
const drawnCrossLine = () => ({ ...drawnLine(), axisLabel: { fill: fill(1), color: IIB.canvas } });

interface AnnotationFields {
    x: AgWidgetField;
    value: AgWidgetField;
}

/**
 * Bars with seeded annotations. Annotation x-values accept strings, so callouts land on a
 * category axis and not only on the financial charts this module is usually paired with.
 */
export class AnnotationsWidget extends ChartWidgetBase<AnnotationsDef, AnnotationFields> {
    protected resolveFields(m: AgWidgetDataMapping<AnnotationsDef>): AnnotationFields | null {
        const x = m.x?.[0];
        const value = m.value?.[0];
        return x && value ? { x, value } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<AnnotationsDef>,
        f: AnnotationFields
    ): Promise<AgChartOptions | null> {
        const { results } = await widgetApi.getData({ fields: [f.x, f.value] });
        if (!results.rows.length) {
            return null;
        }

        const values = results.rows.map((row) => Number(row[f.value.key]));
        const peak = Math.max(...values);
        const mean = values.reduce((total, v) => total + v, 0) / values.length;
        const peakRow = results.rows[values.indexOf(peak)];
        const peakLabel = widgetApi.formatFieldValue(f.x, peakRow[f.x.key]);
        const midRow = results.rows[Math.floor(results.rows.length / 2)];

        return {
            data: results.rows,
            series: [{ type: 'bar', xKey: f.x.key, yKey: f.value.key }],
            // `axes` is a dictionary keyed by axis name, not an array.
            axes: { x: { type: 'category' }, y: { type: 'number', label: abbreviatedAxisLabel } },
            // Headroom for the callout, which the top of the plot area would otherwise clip.
            padding: { top: 28 },
            annotations: { enabled: true },
            // Annotation styles are only reachable through a theme, not chart options. The
            // base class merges this over the Studio theme.
            theme: {
                overrides: {
                    common: {
                        annotations: {
                            line: drawnLine(),
                            'horizontal-line': drawnCrossLine(),
                            'vertical-line': drawnCrossLine(),
                        },
                    },
                },
            },
            initialState: {
                annotations: [
                    {
                        type: 'horizontal-line',
                        value: mean,
                        stroke: IIB.text,
                        strokeWidth: 1.5,
                        text: { label: 'Mean', color: IIB.text },
                        axisLabel: { fill: IIB.raised, color: IIB.text },
                    },
                    {
                        type: 'callout',
                        start: { x: String(peakRow[f.x.key]), y: peak },
                        end: { x: String(midRow[f.x.key]), y: mean * 1.45 },
                        text: `Peak: ${peakLabel}`,
                        stroke: IIB.text,
                        fill: IIB.raised,
                        color: IIB.text,
                    },
                ],
            },
            suppressFieldDotNotation: true,
        };
    }
}
