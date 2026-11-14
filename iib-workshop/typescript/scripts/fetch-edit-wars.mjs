/**
 * Rebuilds the Information is Beautiful "Wikipedia edit wars" dataset against live Wikipedia.
 *
 * The IIB CSV is a 2013 snapshot. This joins each of its rows to the article's current stats
 * from XTools, so the output carries both the 2013 edit count and today's, plus fields IIB
 * never had (distinct editors, anonymous share, quality assessment, pageviews).
 *
 * Run: node scripts/fetch-edit-wars.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const UA = 'ag-studio-demo-dataset/1.0 (https://github.com/ag-grid/ag-studio)';

/**
 * Many IIB subjects are descriptions of a dispute rather than article titles
 * ("Fossil fuel for reciprocating piston engines equipped with spark plugs" is Gasoline), so
 * they cannot be resolved automatically. Anything absent here is used as-is.
 */
const TITLE_OVERRIDES = {
    2000: '2000',
    'Alumin(i)um': 'Aluminium',
    'Angels & Airwaves': 'Angels %26 Airwaves',
    'Arachno-phobia': 'Arachnophobia',
    'Brazil / Brasil': 'Brazil',
    'Caesar Salad': 'Caesar salad',
    'Chicken Alaska': 'Chicken, Alaska',
    'Cow tipping': 'Cow tipping',
    'Doctor Who (Turn Left)': 'Turn Left (Doctor Who)',
    'Exploding Whale': 'Exploding whale',
    'Fossil fuel for reciprocating piston engines equipped with spark plugs': 'Gasoline',
    'Grace Kelly and Cher': 'Grace Kelly',
    'Gray or Grey Squirrels?': 'Eastern gray squirrel',
    "Heather' of Silent Hill 3": 'Silent Hill 3',
    'Heights of Presidents of the United States':
        'Heights of presidents and presidential candidates of the United States',
    'Iron Maiden': 'Iron Maiden',
    'Jimmy Wales': 'Jimmy Wales',
    Kiev: 'Kyiv',
    'Money (Pink Floyd Song)': 'Money (Pink Floyd song)',
    Palin: 'Sarah Palin',
    'Potato chip': 'Potato chip',
    Preteen: 'Preadolescence',
    'Sea of Japan': 'Sea of Japan',
    'Spice and Wolf': 'Spice and Wolf',
    'Spore (video game)': 'Spore (2008 video game)',
    'St Pancras vs. St Pancras International': 'St Pancras railway station',
    'Star Wars Episode III: Revenge of the Sith': 'Star Wars: Episode III \u2013 Revenge of the Sith',
    'Star Wars Episode IV: A New Hope': 'Star Wars (film)',
    'Street Fighter Character Articles': 'Ryu (Street Fighter)',
    'Sulfur or Sulphur': 'Sulfur',
    'The Empire Strikes Back': 'The Empire Strikes Back',
    'United States Presidential Election, 2008': '2008 United States presidential election',
    'User: Jimbo Wales': 'User:Jimbo Wales',
    'Yoghurt or Yogurt': 'Yogurt',
    Cuteness: 'Cuteness',
    Enceladus: 'Enceladus',
    'National House Building Council': 'National House Building Council',
    'WrestleMania III': 'WrestleMania III',
};

function parseCsv(text) {
    const rows = [];
    let row = [],
        field = '',
        quoted = false;
    for (let i = 0; i < text.length; ++i) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    ++i;
                } else {
                    quoted = false;
                }
            } else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') {
            row.push(field);
            field = '';
        } else if (c === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (c !== '\r') field += c;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((c) => c.trim()));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * XTools reports on the exact title it is given, and a redirect page has only a handful of
 * edits of its own - "Potato chip" returns 23, not the article's real total. Resolve to the
 * canonical title first.
 */
async function resolveTitle(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&redirects=1&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return { title, redirected: false };
    const q = (await res.json()).query;
    const pages = Object.values(q?.pages ?? {});
    const final = pages[0]?.title;
    if (!final || pages[0]?.missing !== undefined)
        return { title, redirected: false, missing: pages[0]?.missing !== undefined };
    return { title: final, redirected: final !== title };
}

async function articleInfo(title) {
    const url = `https://xtools.wmcloud.org/api/page/articleinfo/en.wikipedia.org/${encodeURIComponent(title).replace(/%3A/g, ':')}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const d = await res.json();
    if (d.error || d.revisions == null) return { error: d.error ?? 'no revisions field' };
    return d;
}

const csv = readFileSync(`${HERE}source/iib-wikipedia-edit-wars.csv`, 'utf8');
const [, ...rows] = parseCsv(csv);

const out = [];
const failures = [];
for (const [subject, edits2013, conflictType, createdYear, detail] of rows) {
    const clean = subject.trim();
    const requested = TITLE_OVERRIDES[clean] ?? clean;
    const resolved = await resolveTitle(requested);
    const title = resolved.title;
    await sleep(200);
    const info = await articleInfo(title);
    if (info.error) {
        failures.push({ subject: clean, title, error: info.error });
        console.log(`FAIL  ${clean}  ->  ${title}  (${info.error})`);
    } else {
        out.push({
            subject: clean,
            article: title,
            redirectedFrom: resolved.redirected ? requested : null,
            conflictType: conflictType.trim(),
            edits2013: Number(edits2013.replace(/[",]/g, '')) || null,
            editsNow: info.revisions,
            editors: info.editors,
            anonEdits: info.anon_edits,
            minorEdits: info.minor_edits,
            watchers: info.watchers ?? null,
            pageviewsMonthly: info.pageviews ?? null,
            createdYear: Number((info.created_at ?? '').slice(0, 4)) || Number(createdYear) || null,
            iibCreatedYear: Number(createdYear) || null,
            quality: info.assessment?.value ?? 'Unassessed',
            detail: detail.trim(),
            // A cumulative edit count cannot fall. Where it appears to, the 2013 figure is
            // unreliable or refers to a different page, so the growth ratio is not meaningful.
            countsDisagree: Number(edits2013.replace(/[",]/g, '')) > info.revisions,
        });
        console.log(`ok    ${clean.padEnd(42)} ${String(info.revisions).padStart(7)} edits`);
    }
    await sleep(700);
}

writeFileSync(
    `${HERE}source/edit-wars-raw.json`,
    JSON.stringify({ fetchedAt: new Date().toISOString(), rows: out, failures }, null, 2)
);
// A page with very few edits is almost always a mis-resolved title rather than a genuinely
// quiet article, so surface those for a human to check rather than shipping them silently.
const suspicious = out.filter((r) => r.editsNow < 400);
console.log(`\n${out.length} resolved, ${failures.length} failed`);
if (suspicious.length) {
    console.log(`\nSUSPICIOUSLY LOW (check the title mapping):`);
    for (const r of suspicious) console.log(`  ${r.subject} -> ${r.article}: ${r.editsNow} edits`);
}
const redirected = out.filter((r) => r.redirectedFrom);
console.log(`\n${redirected.length} titles followed a redirect`);
if (failures.length) console.log(failures.map((f) => `  ${f.subject} -> ${f.title}: ${f.error}`).join('\n'));
