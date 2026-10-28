/**
 * Turns scripts/source/edit-wars-raw.json into the typed data source the app imports,
 * src/shared/data/editWars.ts. Run after fetch-edit-wars.mjs.
 *
 * The output is not formatted. To match the committed file, format it with
 *   npx prettier@3 --no-config --single-quote --tab-width 4 --print-width 120 --write src/shared/data/editWars.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const { fetchedAt, rows } = JSON.parse(readFileSync(`${HERE}source/edit-wars-raw.json`, 'utf8'));

const esc = (v) => (v == null ? 'null' : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);

const TOP_N = 15;

/**
 * "America!" is Information is Beautiful's own label, carried verbatim from their CSV. Every
 * article under it is a US-versus-British English dispute (aluminium/aluminum, petrol/gasoline,
 * yoghurt/yogurt), so the exclamation mark is their editorial voice rather than data. Renamed
 * to something a reader can act on; the original survives in scripts/source/.
 */
const CONFLICT_TYPE_LABELS = {
    'America!': 'US vs UK English',
    // Capitalised as the film title rather than by the general rule below, which would
    // give "Star wars".
    'star wars': 'Star Wars',
};

/** IIB's types are lower case ("ethnic feud"); they read as labels once capitalised. */
const conflictType = (raw) => {
    const mapped = CONFLICT_TYPE_LABELS[raw];
    if (mapped) {
        return mapped;
    }
    return raw.charAt(0).toUpperCase() + raw.slice(1);
};

/**
 * Four rows arrive from Information is Beautiful with an empty `detail`, so the grid showed
 * blank cells for them. These descriptions are OURS, not IIB's: everything else in that
 * column is their editorial writing, carried through unchanged. Each states the dispute the
 * article's own talk page records.
 */
const MISSING_DETAIL = {
    'Alumin(i)um':
        'Is the element spelled "aluminium", as IUPAC and British usage have it, or "aluminum", as North America has it?',
    'Brazil / Brasil': 'Should the article use the English "Brazil" or the Portuguese "Brasil"?',
    'Sulfur or Sulphur':
        'IUPAC settled on "sulfur" in 1990 and British usage kept "sulphur". Which spelling should the article carry?',
    'Yoghurt or Yogurt': 'Is it "yogurt", "yoghurt", or the rarer "yoghourt"?',
};

const detailFor = (r) => (r.detail || '').trim() || MISSING_DETAIL[r.subject] || '';

const SNAPSHOT_YEAR = Number(fetchedAt.slice(0, 4));

/**
 * Columns derived from the fetched ones, so a reader can follow an angle without writing a
 * calculation first: how hard each person fought, how much of the fighting was drive-by,
 * how long the page has been around, and how much attention it draws per edit.
 */
const derived = (r) => {
    const ageYears = Math.max(1, SNAPSHOT_YEAR - r.createdYear);
    return {
        ageYears,
        decade: `${Math.floor(r.createdYear / 10) * 10}s`,
        editsPerEditor: r.editors ? Number((r.editsNow / r.editors).toFixed(2)) : null,
        anonShare: r.editsNow ? Number((r.anonEdits / r.editsNow).toFixed(4)) : null,
        editsPerYear: Math.round(r.editsNow / ageYears),
        viewsPerEdit: r.pageviewsMonthly != null ? Number((r.pageviewsMonthly / r.editsNow).toFixed(2)) : null,
    };
};

const toRecord = (r) => {
    const growth = r.edits2013 && !r.countsDisagree ? Number((r.editsNow / r.edits2013).toFixed(3)) : null;
    const d = derived(r);
    return (
        `        {\n` +
        `            subject: ${esc(r.subject)},\n` +
        `            article: ${esc(r.article)},\n` +
        `            conflictType: ${esc(conflictType(r.conflictType))},\n` +
        `            quality: ${esc(r.quality)},\n` +
        `            createdYear: ${r.createdYear},\n` +
        `            edits2013: ${r.edits2013 ?? 'null'},\n` +
        `            editsNow: ${r.editsNow},\n` +
        `            growth: ${growth ?? 'null'},\n` +
        `            editors: ${r.editors},\n` +
        `            anonEdits: ${r.anonEdits},\n` +
        `            watchers: ${r.watchers ?? 'null'},\n` +
        `            pageviewsMonthly: ${r.pageviewsMonthly ?? 'null'},\n` +
        `            ageYears: ${d.ageYears},\n` +
        `            decade: ${esc(d.decade)},\n` +
        `            editsPerEditor: ${d.editsPerEditor ?? 'null'},\n` +
        `            anonShare: ${d.anonShare ?? 'null'},\n` +
        `            editsPerYear: ${d.editsPerYear},\n` +
        `            viewsPerEdit: ${d.viewsPerEdit ?? 'null'},\n` +
        `            detail: ${esc(detailFor(r))},\n` +
        `        },`
    );
};

const ranked = rows.slice().sort((a, b) => b.editsNow - a.editsNow);

/**
 * One row per dispute type, ordered by total edits. A radial chart follows data order, so
 * feeding it the raw rows scatters the petals; this makes them descend around the circle.
 */
const byType = [...new Map(rows.map((r) => [conflictType(r.conflictType), null])).keys()]
    .map((type) => {
        const members = rows.filter((r) => conflictType(r.conflictType) === type);
        return {
            conflictType: type,
            articles: members.length,
            totalEdits: members.reduce((t, r) => t + r.editsNow, 0),
            totalEditors: members.reduce((t, r) => t + r.editors, 0),
            // The two split the total, so a stacked petal still measures total edits.
            anonEdits: members.reduce((t, r) => t + r.anonEdits, 0),
            signedInEdits: members.reduce((t, r) => t + (r.editsNow - r.anonEdits), 0),
            avgEdits: Math.round(members.reduce((t, r) => t + r.editsNow, 0) / members.length),
        };
    })
    .sort((a, b) => b.totalEdits - a.totalEdits);

const byTypeRecords = byType
    .map(
        (t) =>
            `        {\n` +
            `            conflictType: ${esc(t.conflictType)},\n` +
            `            articles: ${t.articles},\n` +
            `            totalEdits: ${t.totalEdits},\n` +
            `            totalEditors: ${t.totalEditors},\n` +
            `            anonEdits: ${t.anonEdits},\n` +
            `            signedInEdits: ${t.signedInEdits},\n` +
            `            avgEdits: ${t.avgEdits},\n` +
            `        },`
    )
    .join('\n');
const records = ranked.map(toRecord).join('\n');
// Studio's widget mappings have no top-N control, so a ranked bar over all 75 rows is
// unreadable. The leaders get their own source rather than a filter the reader cannot see.
const topRecords = ranked.slice(0, TOP_N).map(toRecord).join('\n');

const file = `import type { AgDataSourcesDefinition } from 'ag-studio';

import type { AppRegistry } from '../widgets/types';

export const EDIT_WARS_SOURCE = 'editWars';
export const EDIT_WARS_TOP_SOURCE = 'editWarsTop';
export const EDIT_WARS_TYPE_SOURCE = 'editWarsByType';

/**
 * Wikipedia edit wars: Information is Beautiful's 2013 snapshot joined to live article stats.
 *
 * GENERATED FILE - do not edit by hand. Regenerate with:
 *   node scripts/fetch-edit-wars.mjs && node scripts/build-data-source.mjs
 *
 * Subjects and the \`detail\` text come from IIB's dataset, itself drawn from
 * Wikipedia:Lamest_edit_wars. Everything else is read from the live article via XTools
 * (https://xtools.wmcloud.org/api/page/articleinfo/en.wikipedia.org/<title>) on
 * ${fetchedAt.slice(0, 10)}, so the numbers move if you regenerate.
 *
 * \`growth\` is editsNow / edits2013, and is null where the two cannot be reconciled: a
 * cumulative edit count cannot fall, so where IIB's 2013 figure exceeds today's it is
 * measuring something else and the ratio would be meaningless.
 */
export const editWarsData: AgDataSourcesDefinition<AppRegistry> = {
    sources: [
        {
            id: EDIT_WARS_SOURCE,
            name: 'All Articles',
            description:
                'One row per disputed article - all ${rows.length} on the Information is Beautiful list, each joined to its live Wikipedia statistics. The table to start from.',
            data: [
${records}
            ],
            fields: [
                { id: 'subject', name: 'Subject', format: 'textFormat' },
                { id: 'article', name: 'Article', format: 'textFormat' },
                { id: 'conflictType', name: 'Conflict Type', format: 'textFormat' },
                { id: 'quality', name: 'Quality', format: 'textFormat' },
                { id: 'createdYear', name: 'Created Year', format: 'integerFormat' },
                { id: 'edits2013', name: 'Edits 2013', format: 'integerFormat' },
                { id: 'editsNow', name: 'Edits Now', format: 'integerFormat' },
                { id: 'growth', name: 'Growth', format: 'decimalFormat' },
                { id: 'editors', name: 'Editors', format: 'integerFormat' },
                { id: 'anonEdits', name: 'Anonymous Edits', format: 'integerFormat' },
                { id: 'watchers', name: 'Watchers', format: 'integerFormat' },
                { id: 'pageviewsMonthly', name: 'Page Views Monthly', format: 'integerFormat' },
                {
                    id: 'ageYears',
                    name: 'Age (Years)',
                    format: 'integerFormat',
                    description: 'Years from the page being created to this snapshot.',
                },
                {
                    id: 'decade',
                    name: 'Created Decade',
                    format: 'textFormat',
                    description: 'Created Year rounded down, for grouping without a bucket.',
                },
                {
                    id: 'editsPerEditor',
                    name: 'Edits per Editor',
                    format: 'decimalFormat',
                    description: 'How hard the average participant fought. High means a few people going back and forth.',
                },
                {
                    id: 'anonShare',
                    name: 'Anonymous Share',
                    format: 'percentageFormat',
                    description: 'Share of edits made without signing in, so how much of it was drive-by.',
                },
                {
                    id: 'editsPerYear',
                    name: 'Edits per Year',
                    format: 'integerFormat',
                    description: 'Total edits spread over the years the page has existed, so old pages do not simply win.',
                },
                {
                    id: 'viewsPerEdit',
                    name: 'Views per Edit',
                    format: 'decimalFormat',
                    description: 'Monthly page views against total edits: attention drawn per unit of effort.',
                },
                { id: 'detail', name: 'Detail', format: 'textFormat' },
            ],
        },
        {
            id: EDIT_WARS_TOP_SOURCE,
            name: 'Top ${TOP_N} Articles',
            description:
                'The same columns as All Articles, already ranked and cut to the ${TOP_N} most-edited. Use it for ranked bars, where all ${rows.length} articles would be unreadable.',
            data: [
${topRecords}
            ],
            fields: [
                { id: 'subject', name: 'Subject', format: 'textFormat' },
                { id: 'article', name: 'Article', format: 'textFormat' },
                { id: 'conflictType', name: 'Conflict Type', format: 'textFormat' },
                { id: 'quality', name: 'Quality', format: 'textFormat' },
                { id: 'createdYear', name: 'Created Year', format: 'integerFormat' },
                { id: 'edits2013', name: 'Edits 2013', format: 'integerFormat' },
                { id: 'editsNow', name: 'Edits Now', format: 'integerFormat' },
                { id: 'growth', name: 'Growth', format: 'decimalFormat' },
                { id: 'editors', name: 'Editors', format: 'integerFormat' },
                { id: 'anonEdits', name: 'Anonymous Edits', format: 'integerFormat' },
                { id: 'watchers', name: 'Watchers', format: 'integerFormat' },
                { id: 'pageviewsMonthly', name: 'Page Views Monthly', format: 'integerFormat' },
                {
                    id: 'ageYears',
                    name: 'Age (Years)',
                    format: 'integerFormat',
                    description: 'Years from the page being created to this snapshot.',
                },
                {
                    id: 'decade',
                    name: 'Created Decade',
                    format: 'textFormat',
                    description: 'Created Year rounded down, for grouping without a bucket.',
                },
                {
                    id: 'editsPerEditor',
                    name: 'Edits per Editor',
                    format: 'decimalFormat',
                    description: 'How hard the average participant fought. High means a few people going back and forth.',
                },
                {
                    id: 'anonShare',
                    name: 'Anonymous Share',
                    format: 'percentageFormat',
                    description: 'Share of edits made without signing in, so how much of it was drive-by.',
                },
                {
                    id: 'editsPerYear',
                    name: 'Edits per Year',
                    format: 'integerFormat',
                    description: 'Total edits spread over the years the page has existed, so old pages do not simply win.',
                },
                {
                    id: 'viewsPerEdit',
                    name: 'Views per Edit',
                    format: 'decimalFormat',
                    description: 'Monthly page views against total edits: attention drawn per unit of effort.',
                },
                { id: 'detail', name: 'Detail', format: 'textFormat' },
            ],
        },
        {
            id: EDIT_WARS_TYPE_SOURCE,
            name: 'Dispute Type Totals',
            description:
                'One row per dispute type rather than per article, with the article, edit and editor counts already summed. Use it for part-to-whole charts.',
            data: [
${byTypeRecords}
            ],
            fields: [
                { id: 'conflictType', name: 'Conflict Type', format: 'textFormat' },
                { id: 'articles', name: 'Articles', format: 'integerFormat' },
                { id: 'totalEdits', name: 'Total Edits', format: 'integerFormat' },
                { id: 'totalEditors', name: 'Total Editors', format: 'integerFormat' },
                {
                    id: 'signedInEdits',
                    name: 'Signed-in Edits',
                    format: 'integerFormat',
                    description: 'Edits by a named account. Adds to Anonymous Edits to give Total Edits.',
                },
                {
                    id: 'anonEdits',
                    name: 'Anonymous Edits',
                    format: 'integerFormat',
                    description: 'Edits made without signing in, so recorded against an IP address.',
                },
                { id: 'avgEdits', name: 'Average Edits', format: 'integerFormat' },
            ],
        },
    ],
};
`;

// `src/shared` holds the demo's shared code: a copy in the published starter, a link to it in the
// AG Studio repo. Writing through it updates the one file either way.
writeFileSync(new URL('../src/shared/data/editWars.ts', import.meta.url), file);
console.log(`Wrote src/shared/data/editWars.ts (${rows.length} rows, fetched ${fetchedAt.slice(0, 10)})`);
