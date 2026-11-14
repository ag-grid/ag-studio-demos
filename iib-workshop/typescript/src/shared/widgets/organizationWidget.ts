import type { AgChartOptions } from 'ag-charts-enterprise';
import type { AgWidgetDataMapping, AgWidgetField, AgWidgetParams } from 'ag-studio';

import { IIB, fill } from '../theme';
import { ChartWidgetBase } from './chartWidgetBase';
import type { OrganizationDef } from './types';

interface Fields {
    id: AgWidgetField;
    parentId: AgWidgetField;
    title: AgWidgetField;
    subtitle: AgWidgetField;
}

/** A coloured initials disc per person, as a data URI. */
function avatarUri(name: string, index: number): string {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
    const disc = fill(index);
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">` +
        `<circle cx="28" cy="28" r="28" fill="${disc}"/>` +
        `<text x="28" y="29" fill="${IIB.canvas}" font-family="${IIB.font.replace(/"/g, "'")}" ` +
        `font-size="22" font-weight="700" text-anchor="middle" dominant-baseline="central">${initials}</text>` +
        `</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export class OrganizationWidget extends ChartWidgetBase<OrganizationDef, Fields> {
    protected resolveFields(m: AgWidgetDataMapping<OrganizationDef>): Fields | null {
        const id = m.id?.[0];
        const parentId = m.parentId?.[0];
        const title = m.title?.[0];
        const subtitle = m.subtitle?.[0];
        return id && parentId && title && subtitle ? { id, parentId, title, subtitle } : null;
    }

    protected async buildOptions(
        { widgetApi }: AgWidgetParams<OrganizationDef>,
        f: Fields
    ): Promise<AgChartOptions | null> {
        // Four category fields and no measure, so the engine returns one row per distinct
        // combination - one row per employee.
        const { results } = await widgetApi.getData({ fields: [f.id, f.parentId, f.title, f.subtitle] });
        if (!results.rows.length) {
            return null;
        }

        // The series treats a nullish parentId as the root. Grouping on a null-valued
        // category can surface as either null or an empty string, so normalise both.
        const data = results.rows.map((row, index) => {
            const parent = row[f.parentId.key];
            return {
                ...row,
                [f.parentId.key]: parent === '' ? null : parent,
                avatar: avatarUri(String(row[f.title.key] ?? ''), index),
            };
        });

        return {
            data,
            series: [
                {
                    type: 'organization',
                    idKey: f.id.key,
                    parentIdKey: f.parentId.key,
                    // The series' default card is light, which reads as a hole punched in
                    // the dark canvas, and its text colours are tuned for that light card.
                    node: {
                        fill: IIB.raised,
                        stroke: IIB.border,
                        cornerRadius: 8,
                        image: { key: 'avatar', width: 34, height: 34, position: 'left', spacing: 10 },
                        // The defaults are small and low contrast: the subtitle is the
                        // hardest line to read on a projector, so it gets a real size and a
                        // near-body colour rather than the muted grey.
                        title: { key: f.title.key, color: IIB.text, fontSize: 14, fontWeight: 600 },
                        subtitle: { key: f.subtitle.key, color: IIB.text, fontSize: 12.5 },
                    },
                    // Every card highlights on hover; only the expander shows which ones collapse.
                    expander: {
                        enabled: true,
                        fill: IIB.widget,
                        stroke: IIB.border,
                        cornerRadius: 5,
                        padding: { top: 2, right: 6, bottom: 2, left: 6 },
                        text: { color: IIB.text, fontSize: 12, fontWeight: 600 },
                        hoverStyle: { fill: IIB.accent, stroke: IIB.accent, text: { color: IIB.canvas } },
                    },
                    link: { stroke: IIB.axisLine },
                },
            ],
            suppressFieldDotNotation: true,
        };
    }
}
