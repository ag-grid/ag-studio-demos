/**
 * Turns Information is Beautiful's "Live Long & Prosper" sheet into the typed data source the
 * app imports, src/shared/data/longevity.ts.
 *
 * Run: node scripts/build-longevity-source.mjs            (downloads the sheet first)
 *      node scripts/build-longevity-source.mjs --offline  (rebuilds from scripts/source/)
 * The output is not formatted. To match the committed file, format it with
 *   npx prettier@3 --no-config --single-quote --tab-width 4 --print-width 120 --write src/shared/data/longevity.ts
 *
 * Two tabs are read. "longevity data for exercise" is the cleaned one - a number for every
 * intervention, an evidence score and an ID - and supplies the values. "Longevity data" is
 * the original, and supplies what the cleaned tab dropped: the years as first published
 * (a range, or "large") and who each intervention affects, which the cleaned tab leaves
 * blank wherever it was "Both". The other tabs - a copy of the first, loose links and a
 * welcome note - hold no table.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SHEET = '1OdddTttI2l47SIgH0VW-q4XfHNJRa6bMbNHL8N4edU8';
const TABS = {
    cleaned: { gid: '26967903', file: `${HERE}source/longevity-for-exercise.csv` },
    original: { gid: '0', file: `${HERE}source/longevity-original.csv` },
};

if (!process.argv.includes('--offline')) {
    for (const { gid, file } of Object.values(TABS)) {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${gid}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Could not download tab ${gid}: ${response.status}`);
        }
        writeFileSync(file, await response.text());
    }
}

/** RFC 4180: quoted fields may hold commas, doubled quotes and line breaks. */
function parseCsv(text) {
    const rows = [[]];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; ++i) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') {
                field += '"';
                ++i;
            } else if (c === '"') {
                quoted = false;
            } else {
                field += c;
            }
        } else if (c === '"') {
            quoted = true;
        } else if (c === ',') {
            rows.at(-1).push(field);
            field = '';
        } else if (c === '\n') {
            rows.at(-1).push(field);
            field = '';
            rows.push([]);
        } else if (c !== '\r') {
            field += c;
        }
    }
    rows.at(-1).push(field);
    return rows;
}

/** Row 0 is the header and row 1 a line of notes on the columns, so data starts at row 2. */
const dataRows = (file) =>
    parseCsv(readFileSync(file, 'utf8'))
        .slice(2)
        .filter((row) => row[0]?.trim());

const cleaned = dataRows(TABS.cleaned.file);
const original = dataRows(TABS.original.file);

// Column positions, as the two tabs lay them out.
const C = { name: 0, years: 1, strength: 2, score: 3, note: 6, detail: 7, id: 9, sources: 10, links: 11 };
const O = { name: 0, years: 1, sexes: 3 };

if (cleaned.length !== original.length) {
    throw new Error(`The tabs disagree on row count: ${cleaned.length} against ${original.length}`);
}

const clean = (value) => value.replace(/\s+/g, ' ').trim();
const capitalise = (value) => value.charAt(0).toUpperCase() + value.slice(1);

/** The original's own wording, tidied to one spelling per group so a filter lists each once. */
const SEXES = {
    Both: 'Both',
    Male: 'Male',
    male: 'Male',
    Female: 'Female',
    'Both, but esp. for men': 'Both (especially men)',
    'Both but especially for women': 'Both (especially women)',
};

const interventions = [];
const evidence = new Map();
const links = [];

cleaned.forEach((row, i) => {
    const source = original[i];
    const name = clean(row[C.name]);
    if (clean(source[O.name]) !== name) {
        throw new Error(`Row ${i + 3} names "${name}" in one tab and "${clean(source[O.name])}" in the other`);
    }
    const id = Number(row[C.id]);
    const years = Number(row[C.years]);
    const strength = capitalise(clean(row[C.strength]));
    const sexes = SEXES[clean(source[O.sexes])];
    if (!Number.isInteger(id) || !Number.isFinite(years) || !strength || !sexes) {
        throw new Error(`Row ${i + 3} (${name}) is missing an ID, a number of years, a strength or who it affects`);
    }
    evidence.set(strength, Number(row[C.score]));

    interventions.push({
        interventionId: id,
        intervention: capitalise(name),
        yearsGainedOrLost: years,
        yearsAsPublished: clean(source[O.years]) || 'not given',
        // The sheet's own effect column says "positive" for four interventions that cost
        // years, so the sign of the number decides instead.
        effect: years < 0 ? 'Costs years' : 'Adds years',
        evidenceStrength: strength,
        sexesAffected: sexes,
        note: clean(row[C.note]) || null,
        evidenceDetail: clean(row[C.detail]) || null,
        sources: clean(row[C.sources]) || null,
    });

    for (const raw of row.slice(C.links).map(clean).filter(Boolean)) {
        const url = /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
        links.push({ interventionId: id, url, website: new URL(url).hostname.replace(/^www\./, '') });
    }
});

// Lookups are keyed by value, so a new level in the sheet is a new row here with no code change.
const evidenceLevels = [...evidence]
    .sort((a, b) => b[1] - a[1])
    .map(([evidenceStrength, evidenceScore]) => ({ evidenceStrength, evidenceScore }));

const literal = (value) => JSON.stringify(value, null, 4).replace(/"([A-Za-z]+)":/g, '$1:');

const out = `import type { AgDataSourcesDefinition } from 'ag-studio';

import type { AppRegistry } from '../widgets/types';

export const LONGEVITY_SOURCE = 'longevity';
export const LONGEVITY_EVIDENCE_SOURCE = 'longevityEvidence';
export const LONGEVITY_LINKS_SOURCE = 'longevityLinks';

/**
 * Live Long & Prosper: Information is Beautiful's longevity dataset, from the book Knowledge
 * is Beautiful (2014).
 *
 * GENERATED FILE - do not edit by hand. Regenerate with:
 *   node scripts/build-longevity-source.mjs
 *
 * Read from https://docs.google.com/spreadsheets/d/${SHEET}, joining its cleaned tab to the
 * original. See the script for which column comes from which tab.
 */
export const longevityData: AgDataSourcesDefinition<AppRegistry> = {
    sources: [
        {
            id: LONGEVITY_SOURCE,
            name: 'Longevity Interventions',
            description:
                'One row per habit, trait or circumstance - ${interventions.length} in all - with the years of life it adds or costs on average. The table to start from.',
            data: ${literal(interventions).replace(/\n/g, '\n            ')},
            fields: [
                {
                    id: 'interventionId',
                    name: 'Intervention ID',
                    format: 'integerFormat',
                    description: 'Joins to Longevity Source Links. Not a quantity: never sum it.',
                },
                { id: 'intervention', name: 'Intervention', format: 'textFormat' },
                {
                    id: 'yearsGainedOrLost',
                    name: 'Years Gained or Lost',
                    format: 'decimalFormat',
                    description:
                        'Average change in life expectancy, in years. Negative means years lost. Where the study gave a range or no figure, this is the dataset author\\'s estimate; Years (as published) has the original.',
                },
                {
                    id: 'yearsAsPublished',
                    name: 'Years (as published)',
                    format: 'textFormat',
                    description: 'The figure as the source stated it, including ranges such as 5-10. Text, not a number.',
                },
                {
                    id: 'effect',
                    name: 'Effect',
                    format: 'textFormat',
                    description: 'Adds years or Costs years, from the sign of Years Gained or Lost.',
                },
                {
                    id: 'evidenceStrength',
                    name: 'Evidence Strength',
                    format: 'textFormat',
                    description: 'Strong, Good or Suggestive. Joins to Longevity Evidence Levels, which holds the score.',
                },
                { id: 'sexesAffected', name: 'Sexes Affected', format: 'textFormat' },
                {
                    id: 'note',
                    name: 'Note',
                    format: 'textFormat',
                    description: 'The condition the figure applies to, such as "for 8-11 hours sitting a day".',
                },
                { id: 'evidenceDetail', name: 'Evidence Detail', format: 'textFormat' },
                { id: 'sources', name: 'Sources', format: 'textFormat' },
            ],
        },
        {
            id: LONGEVITY_EVIDENCE_SOURCE,
            name: 'Longevity Evidence Levels',
            description:
                'How strong the science behind each intervention is: one row per level, with the dataset\\'s own score. Joined to Longevity Interventions on Evidence Strength.',
            data: ${literal(evidenceLevels).replace(/\n/g, '\n            ')},
            fields: [
                { id: 'evidenceStrength', name: 'Evidence Strength', format: 'textFormat' },
                {
                    id: 'evidenceScore',
                    name: 'Evidence Score (1-3)',
                    format: 'integerFormat',
                    description: '3 is Strong, 2 Good, 1 Suggestive. Average it rather than summing it.',
                },
            ],
        },
        {
            id: LONGEVITY_LINKS_SOURCE,
            name: 'Longevity Source Links',
            description:
                'Every link cited, one row each - ${links.length} across the ${interventions.length} interventions. Joined to Longevity Interventions on Intervention ID, so count rows here for how many sources back each one.',
            data: ${literal(links).replace(/\n/g, '\n            ')},
            fields: [
                {
                    id: 'interventionId',
                    name: 'Intervention ID',
                    format: 'integerFormat',
                    description: 'The intervention this link supports. Not a quantity: never sum it.',
                },
                { id: 'website', name: 'Website', format: 'textFormat' },
                { id: 'url', name: 'Link', format: 'textFormat' },
            ],
        },
    ],
};
`;

// `src/shared` holds the demo's shared code: a copy in the published starter, a link to it in the
// AG Studio repo. Writing through it updates the one file either way.
writeFileSync(new URL('../src/shared/data/longevity.ts', import.meta.url), out);
console.log(
    `Wrote src/shared/data/longevity.ts: ${interventions.length} interventions, ${evidenceLevels.length} evidence levels, ${links.length} links`
);
