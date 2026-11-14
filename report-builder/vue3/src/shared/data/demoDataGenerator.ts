/**
 * TypeScript port of generate_office_b2b_demo.py.
 *
 * Generates the same 6-table B2B office-supplies dataset used by the main demo.
 * Distributions are simplified (uniform ranges in place of lognormal/normal where
 * exact shape is not required) - field names and row counts are identical.
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const SEED = '20260122';
const END_DT = new Date('2026-01-21T23:59:59Z');

// Row counts at SF=1 follow TPC-H conventions (SF=1 ≈ 1 GB uncompressed).
// N_STORES is a fixed dimension and does not scale.
const N_STORES = 50;
const N_PRODUCTS = 200_000; // TPC-H PART
const N_CUSTOMERS = 150_000; // TPC-H CUSTOMER
const N_ORDERS = 1_500_000; // TPC-H ORDERS
const N_SHIPMENTS = 1_125_000; // 75% of orders (same ratio as original)

// SF=0.004 → ~6k orders - lightweight browser demo matching the b1.0.0 JSON sizes.
// SF=0.04  → ~60k orders (default full demo).
// SF=1     → ~1.5M orders ≈ 1 GB.
const DEFAULT_SCALE_FACTOR = 0.04;

function getScaleFactor(): number {
    // Prefer agStudioOpts.scaleFactor when present (set by studio-debug.js
    // or by the page bootstrap from URL params).
    const optsSf = (globalThis as any).agStudioOpts?.scaleFactor;
    if (typeof optsSf === 'number' && Number.isFinite(optsSf) && optsSf > 0) {
        return optsSf;
    }
    // Fall back to ?sf query param in browser contexts only.
    if (typeof document !== 'undefined') {
        const param = new URLSearchParams(window.location.search).get('sf');
        if (param != null) {
            const sf = parseFloat(param);
            if (Number.isFinite(sf) && sf > 0) return sf;
        }
    }
    return DEFAULT_SCALE_FACTOR;
}

const SCALE_FACTOR = getScaleFactor();

// ─── RNG helpers ──────────────────────────────────────────────────────────────

type RNG = () => number;

function randInt(rng: RNG, lo: number, hi: number): number {
    return (Math.floor(rng() * (hi - lo)) + lo) | 0;
}

function randFloat(rng: RNG, lo: number, hi: number): number {
    return rng() * (hi - lo) + lo;
}

function pick<T>(rng: RNG, arr: readonly T[]): T {
    return arr[randInt(rng, 0, arr.length)];
}

// ── Optimisation #1: cumulative-weight binary search ──
// Replaces O(n) linear scan in pickWeighted with O(log n) binary search.
// Pre-computed cumulative weight arrays are built once at module level for all
// static weight arrays, avoiding repeated partial-sum accumulation on each call.

/** Build a normalised cumulative weight array from raw weights. */
function buildCumW(w: readonly number[]): Float64Array {
    const length = w.length;
    const out = new Float64Array(length);
    let s = 0;
    for (let i = 0; i < length; ++i) {
        out[i] = s += w[i];
    }
    // Normalise so that entries represent proportions, then pin the last to 1
    // to prevent floating-point drift from causing misses.
    const total = out[length - 1];
    if (total !== 1) {
        for (let i = 0; i < length; ++i) {
            out[i] /= total;
        }
    }
    out[length - 1] = 1;
    return out;
}

/** Returns the index of the selected item using binary search on cumulative weights. */
function pickCumWIdx(rng: RNG, cumW: Float64Array): number {
    const r = rng();
    let lo = 0;
    let hi = cumW.length - 1;

    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumW[mid] < r) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
}

/** Pick from `arr` using a pre-built cumulative weight array (binary search). */
function pickCumW<T>(rng: RNG, arr: readonly T[], cumW: Float64Array): T {
    return arr[pickCumWIdx(rng, cumW)];
}

/** Fisher-Yates shuffle - mutates in place and returns the array. */
function shuffle<T>(rng: RNG, arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; --i) {
        const j = randInt(rng, 0, i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

// ── Optimisation #5: typed-array permutation ──
// Uses Int32Array instead of a JS number[] to avoid boxing overhead and reduce
// GC pressure at SF=1 (1.5M entries).

/** Returns a shuffled Int32Array of [0 .. n-1]. */
function permutation(rng: RNG, n: number): Int32Array {
    const arr = new Int32Array(n);
    for (let i = 0; i < n; ++i) {
        arr[i] = i;
    }
    for (let i = n - 1; i > 0; --i) {
        const j = randInt(rng, 0, i + 1);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

/** Normal sample via Box-Muller (discards the spare for simplicity). */
function randNormal(rng: RNG, mu: number, sigma: number): number {
    let u: number;
    let v: number;
    let s: number;
    do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
    } while (s >= 1 || s === 0);
    return mu + sigma * u * Math.sqrt((-2 * Math.log(s)) / s);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function p2(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

/** Extract UTC month (1-12) from a millisecond timestamp - no Date object allocation. */
function msToMonth(ms: number): number {
    const days = Math.floor(ms / 86_400_000);
    const z = days + 719468;
    const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
    const doe = z - era * 146097;
    const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    const mp = Math.floor((5 * doy + 2) / 153);
    return mp < 10 ? mp + 3 : mp - 9;
}

function daysMs(days: number): number {
    return days * 86_400_000;
}

// ─── Static reference data ────────────────────────────────────────────────────

const REGIONS = ['UK', 'DACH', 'Nordics', 'US East', 'US West'] as const;
const REGION_W = [0.3, 0.2, 0.1, 0.2, 0.2] as const;
// Pre-built cumulative weight array for region selection
const REGION_CUMW = buildCumW(REGION_W);

const CITY_BY_REGION: Record<string, readonly string[]> = {
    UK: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Bristol', 'Edinburgh', 'Glasgow'],
    DACH: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Vienna', 'Zurich'],
    Nordics: ['Stockholm', 'Copenhagen', 'Oslo', 'Helsinki'],
    'US East': ['New York', 'Boston', 'Washington', 'Philadelphia', 'Atlanta', 'Miami'],
    'US West': ['San Francisco', 'Los Angeles', 'Seattle', 'San Diego', 'Portland', 'San Jose'],
};

const SUBCATS = [
    'Paper & Notebooks',
    'Writing Instruments',
    'Filing & Organisation',
    'Desk Accessories',
    'Labels & Mailing',
    'Printing & Imaging',
    'Binders & Presentation',
    'Cleaning & Facilities (Office)',
] as const;
type Subcat = (typeof SUBCATS)[number];

const CATEGORY_BY_SUBCAT: Record<Subcat, string> = {
    'Paper & Notebooks': 'Paper & Print',
    'Printing & Imaging': 'Paper & Print',
    'Writing Instruments': 'Writing & Drawing',
    'Filing & Organisation': 'Filing & Binding',
    'Binders & Presentation': 'Filing & Binding',
    'Desk Accessories': 'Desk & Office',
    'Labels & Mailing': 'Packaging & Mailing',
    'Cleaning & Facilities (Office)': 'Facilities',
};

const SUBCAT_W = [0.22, 0.2, 0.15, 0.12, 0.1, 0.1, 0.07, 0.04] as const;
// Pre-built cumulative weight array for subcategory selection
const SUBCAT_CUMW = buildCumW(SUBCAT_W);

const BRANDS = [
    'PaperLine',
    'StapleForge',
    'Inkwell & Co',
    'DeskMate',
    'FileCraft',
    'LabelWorks',
    'PrintSure',
    'BindRight',
    'CleanSlate Office',
    'NoteNest',
    'Clipster',
    'OfficeBasics',
] as const;

const BRAND_W = BRANDS.map((_, i) => 1 / (i + 1));
const BRAND_W_SUM = BRAND_W.reduce((a, b) => a + b, 0);
const BRAND_W_NORM = BRAND_W.map((w) => w / BRAND_W_SUM);
// Pre-built cumulative weight array for brand selection
const BRAND_CUMW = buildCumW(BRAND_W_NORM);

const NAME_TEMPLATES: Record<Subcat, readonly string[]> = {
    'Paper & Notebooks': [
        'Copy Paper {v} 80gsm',
        'Recycled Paper {v} 75gsm',
        'Notebook {v} Ruled',
        'Notepad {v} Plain',
        'Sticky Notes {v}',
    ],
    'Writing Instruments': [
        'Ballpoint Pens {v}',
        'Gel Pens {v}',
        'Highlighters {v}',
        'Permanent Markers {v}',
        'Whiteboard Markers {v}',
    ],
    'Filing & Organisation': [
        'Document Wallets {v}',
        'Lever Arch Files {v}',
        'File Folders {v}',
        'Desk Trays {v}',
        'Ring Folders {v}',
    ],
    'Desk Accessories': ['Stapler {v}', 'Staples {v}', 'Tape Dispenser {v}', 'Paper Clips {v}', 'Desk Organiser {v}'],
    'Labels & Mailing': [
        'Address Labels {v}',
        'Shipping Labels {v}',
        'Mailing Envelopes {v}',
        'Padded Envelopes {v}',
        'Packing Tape {v}',
    ],
    'Printing & Imaging': [
        'Printer Toner {v} Compatible',
        'Ink Cartridge {v} Compatible',
        'Photo Paper {v}',
        'Thermal Receipt Rolls {v}',
        'Printer Drum Unit {v} Compatible',
    ],
    'Binders & Presentation': [
        'Presentation Folders {v}',
        'Binder Dividers {v}',
        'Plastic Pockets {v}',
        'Spiral Binding Coils {v}',
        'Laminating Pouches {v}',
    ],
    'Cleaning & Facilities (Office)': [
        'Surface Wipes {v}',
        'Hand Towels {v}',
        'Bin Liners {v}',
        'Hand Sanitiser {v}',
        'Air Freshener {v}',
    ],
};

const VARIANTS: Record<Subcat, readonly string[]> = {
    'Paper & Notebooks': ['A4', 'A5', 'Letter', 'Legal'],
    'Writing Instruments': ['Blue', 'Black', 'Red', 'Assorted'],
    'Filing & Organisation': ['A4', 'A5', 'Letter'],
    'Desk Accessories': ['Small', 'Medium', 'Large'],
    'Labels & Mailing': ['Small', 'Medium', 'Large'],
    'Printing & Imaging': ['Black', 'Cyan', 'Magenta', 'Yellow'],
    'Binders & Presentation': ['A4', 'A5', 'Letter'],
    'Cleaning & Facilities (Office)': ['Pack-10', 'Pack-50', 'Pack-200'],
};

const SUFFIXES = ['Standard', 'Pro', 'Plus', 'Bulk', 'Eco', 'Premium'] as const;

const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Retail',
    'Manufacturing',
    'Hospitality',
    'Public Sector',
] as const;
const INDUSTRY_W = [0.16, 0.14, 0.12, 0.12, 0.14, 0.12, 0.1, 0.1] as const;
// Pre-built cumulative weight array for industry selection
const INDUSTRY_CUMW = buildCumW(INDUSTRY_W);

const SEGMENTS = ['SMB', 'Mid-Market', 'Enterprise'] as const;
const SEG_W = [0.6, 0.3, 0.1] as const;
// Pre-built cumulative weight array for segment selection
const SEG_CUMW = buildCumW(SEG_W);

const FIRST_NAMES = [
    'Alex',
    'Sam',
    'Jordan',
    'Taylor',
    'Morgan',
    'Casey',
    'Jamie',
    'Riley',
    'Charlie',
    'Avery',
    'Robin',
    'Cameron',
    'Drew',
    'Quinn',
    'Harper',
    'Rowan',
    'Elliot',
    'Finley',
    'Parker',
    'Reese',
    'Nina',
    'Maya',
    'Amir',
    'Omar',
    'Leah',
    'Hannah',
    'Oliver',
    'Noah',
    'Sophia',
    'Isla',
] as const;

const LAST_NAMES = [
    'Johnson',
    'Smith',
    'Brown',
    'Wilson',
    'Taylor',
    'Davies',
    'Evans',
    'Thomas',
    'Roberts',
    'Walker',
    'White',
    'Hall',
    'Allen',
    'Young',
    'King',
    'Wright',
    'Scott',
    'Green',
    'Baker',
    'Adams',
    'Miller',
    'Jones',
    'Hughes',
    'Clarke',
    'Ward',
    'Turner',
    'Cox',
    'Price',
    'Cooper',
    'Reid',
] as const;

const DEPARTMENTS = [
    'procurement',
    'purchasing',
    'finance',
    'accounts',
    'operations',
    'facilities',
    'it',
    'admin',
    'office',
] as const;

const TLD_BY_REGION: Record<string, readonly string[]> = {
    UK: ['co.uk', 'uk'],
    DACH: ['de', 'at', 'ch'],
    Nordics: ['se', 'dk', 'no', 'fi'],
    'US East': ['com', 'us'],
    'US West': ['com', 'us'],
};

const TLD_W: Record<string, readonly number[]> = {
    UK: [0.85, 0.15],
    DACH: [0.7, 0.15, 0.15],
    Nordics: [0.28, 0.26, 0.23, 0.23],
    'US East': [0.92, 0.08],
    'US West': [0.92, 0.08],
};

// Pre-built cumulative weight arrays for TLD selection per region
const TLD_CUMW: Record<string, Float64Array> = {};
for (const r of REGIONS) {
    TLD_CUMW[r] = buildCumW(TLD_W[r]);
}

const EMAIL_PATTERNS = ['first.last', 'firstlast', 'f.last', 'dept', 'dept.firstlast'] as const;
const EMAIL_PATTERN_W = [0.3, 0.22, 0.18, 0.2, 0.1] as const;
// Pre-built cumulative weight array for email pattern selection
const EMAIL_PATTERN_CUMW = buildCumW(EMAIL_PATTERN_W);

// ─── Product helpers ──────────────────────────────────────────────────────────

function uomPackForName(name: string): [string, number] {
    const n = name.toLowerCase();

    if (n.includes('printer toner') || n.includes('printer drum unit') || n.includes('ink cartridge')) {
        return ['each', 1];
    }
    if (n.includes('thermal receipt rolls')) {
        return ['box', 20];
    }
    if (n.includes('photo paper')) {
        return ['pack', 100];
    }
    if (n.includes('copy paper') || n.includes('recycled paper')) {
        return ['case', 5];
    }
    if (n.includes('notebook')) {
        return ['pack', 5];
    }
    if (n.includes('notepad')) {
        return ['pack', 6];
    }
    if (n.includes('sticky notes')) {
        return ['pack', 12];
    }
    if (n.includes('ballpoint pens') || n.includes('gel pens')) {
        return ['box', 12];
    }
    if (n.includes('highlighters') || n.includes('permanent markers') || n.includes('whiteboard markers')) {
        return ['box', 8];
    }
    if (
        n.includes('lever arch files') ||
        n.includes('ring folders') ||
        n.includes('stapler') ||
        n.includes('tape dispenser') ||
        n.includes('desk organiser') ||
        n.includes('desk trays')
    ) {
        return ['each', 1];
    }
    if (n.includes('file folders') || n.includes('document wallets') || n.includes('presentation folders')) {
        return ['pack', 25];
    }
    if (n.includes('plastic pockets')) {
        return ['pack', 100];
    }
    if (n.includes('binder dividers')) {
        return ['pack', 20];
    }
    if (n.includes('spiral binding coils')) {
        return ['box', 50];
    }
    if (n.includes('laminating pouches')) {
        return ['pack', 100];
    }
    if (n.includes('staples')) {
        return ['box', 5000];
    }
    if (n.includes('paper clips')) {
        return ['box', 1000];
    }
    if (n.includes('address labels') || n.includes('shipping labels')) {
        return ['roll', 1];
    }
    if (n.includes('mailing envelopes') || n.includes('padded envelopes')) {
        return ['box', 250];
    }
    if (n.includes('packing tape')) {
        return ['pack', 6];
    }
    if (n.includes('surface wipes')) {
        return ['case', 12];
    }
    if (n.includes('hand towels')) {
        return ['case', 16];
    }
    if (n.includes('bin liners')) {
        return ['case', 10];
    }
    if (n.includes('hand sanitiser') || n.includes('air freshener')) {
        return ['case', 12];
    }

    return ['each', 1];
}

/**
 * Returns [min, max] price range for uniform sampling.
 * Python uses lognormal(median, sigma) clipped to [min, max]; we use uniform over the same range.
 */
function priceRange(name: string, uom: string): [number, number] {
    const n = name.toLowerCase();

    if (n.includes('printer toner')) {
        return [30, 220];
    }
    if (n.includes('printer drum unit')) {
        return [40, 280];
    }
    if (n.includes('ink cartridge')) {
        return [12, 140];
    }
    if (n.includes('thermal receipt rolls')) {
        return [12, 90];
    }
    if (n.includes('photo paper')) {
        return [8, 70];
    }
    if (n.includes('copy paper') || n.includes('recycled paper')) {
        return [20, 95];
    }
    if (n.includes('notebook')) {
        return [5, 40];
    }
    if (n.includes('notepad')) {
        return [4, 30];
    }
    if (n.includes('sticky notes')) {
        return [3, 25];
    }
    if (n.includes('ballpoint pens') || n.includes('gel pens')) {
        return [4, 35];
    }
    if (n.includes('highlighters')) {
        return [4, 38];
    }
    if (n.includes('permanent markers') || n.includes('whiteboard markers')) {
        return [5, 45];
    }
    if (n.includes('lever arch files')) {
        return [2.5, 20];
    }
    if (n.includes('ring folders')) {
        return [2, 18];
    }
    if (n.includes('document wallets') || n.includes('file folders') || n.includes('presentation folders')) {
        return [6, 45];
    }
    if (n.includes('desk trays')) {
        return [3.5, 28];
    }
    if (n.includes('stapler')) {
        return [3, 30];
    }
    if (n.includes('tape dispenser')) {
        return [2.5, 24];
    }
    if (n.includes('desk organiser')) {
        return [5, 55];
    }
    if (n.includes('staples')) {
        return [2, 18];
    }
    if (n.includes('paper clips')) {
        return [1.5, 14];
    }
    if (n.includes('address labels')) {
        return [3, 22];
    }
    if (n.includes('shipping labels')) {
        return [4, 35];
    }
    if (n.includes('mailing envelopes')) {
        return [7, 55];
    }
    if (n.includes('padded envelopes')) {
        return [12, 85];
    }
    if (n.includes('packing tape')) {
        return [5, 40];
    }
    if (n.includes('plastic pockets')) {
        return [5, 40];
    }
    if (n.includes('binder dividers')) {
        return [2.5, 22];
    }
    if (n.includes('spiral binding coils')) {
        return [7, 60];
    }
    if (n.includes('laminating pouches')) {
        return [8, 70];
    }
    if (n.includes('surface wipes')) {
        return [10, 85];
    }
    if (n.includes('hand towels')) {
        return [12, 95];
    }
    if (n.includes('bin liners')) {
        return [9, 75];
    }
    if (n.includes('hand sanitiser')) {
        return [10, 85];
    }
    if (n.includes('air freshener')) {
        return [7, 70];
    }

    if (uom === 'each') {
        return [2.5, 40];
    }
    if (uom === 'roll') {
        return [3, 35];
    }
    if (uom === 'box') {
        return [4, 60];
    }
    if (uom === 'pack') {
        return [3, 60];
    }
    return [5, 95];
}

// ── Optimisation #3: template-level UOM/pack and price-range lookup tables ──
// Pre-compute uomPackForName and priceRange results for every (subcat, template)
// pair at module load time so genProducts can use direct array lookups instead of
// repeated toLowerCase()+includes() string scans per product.

const TEMPLATE_UOM_PACK: [string, number][][] = SUBCATS.map((sc) =>
    NAME_TEMPLATES[sc].map((tmpl) => {
        const name = tmpl.replace('{v}', VARIANTS[sc][0]) + ' Standard';
        return uomPackForName(name);
    })
);

const TEMPLATE_PRICE_RANGE: [number, number][][] = SUBCATS.map((sc, si) =>
    NAME_TEMPLATES[sc].map((tmpl, ti) => {
        const [uom] = TEMPLATE_UOM_PACK[si][ti];
        const name = tmpl.replace('{v}', VARIANTS[sc][0]) + ' Standard';
        return priceRange(name, uom);
    })
);

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function slugCompany(name: string): string {
    const s = name
        .toLowerCase()
        .replace(/[.,&]/g, ' ')
        .replace(/\b(ltd|gmbh|ab|inc|llc|plc|sas|bv)\b/g, '')
        .replace(/[^a-z0-9]+/g, '');
    return s.slice(0, 30) || 'company';
}

// ─── 1) Stores ────────────────────────────────────────────────────────────────

export interface Store {
    store_id: string;
    store_name: string;
    region: string;
    city: string;
    opened_date: string;
    store_type: string;
}

export interface StoreData {
    store_id: string[];
    store_name: string[];
    region: string[];
    city: string[];
    opened_date: Float64Array; // ms since epoch
    store_type: string[];
}

function genStores(rng: RNG, endMs: number): StoreData {
    const store_id: string[] = [];
    const store_name: string[] = [];
    const region: string[] = [];
    const city: string[] = [];
    const opened_date_ms: number[] = [];
    const store_type: string[] = [];

    let idx = 1;

    // 2 fulfilment hubs per region = 10
    for (const r of REGIONS) {
        for (let i = 0; i < 2; ++i) {
            const c = pick(rng, CITY_BY_REGION[r]);
            store_id.push(`S${idx}`);
            store_name.push(`${c} Fulfilment Hub`);
            region.push(r);
            city.push(c);
            opened_date_ms.push(endMs - daysMs(randInt(rng, 365, 3650)));
            store_type.push('Fulfilment');
            ++idx;
        }
    }

    // remaining: sales offices + partner depots
    const remaining = N_STORES - store_id.length;
    const salesCount = Math.floor(remaining * 0.6);
    const types: string[] = [
        ...Array(salesCount).fill('Sales Office'),
        ...Array(remaining - salesCount).fill('Partner Depot'),
    ];
    shuffle(rng, types);

    // genStores uses pickCumW with the pre-built REGION_CUMW
    for (const t of types) {
        const r = pickCumW(rng, REGIONS, REGION_CUMW);
        const c = pick(rng, CITY_BY_REGION[r]);
        store_id.push(`S${idx}`);
        store_name.push(`${c} ${t}`);
        region.push(r);
        city.push(c);
        opened_date_ms.push(endMs - daysMs(randInt(rng, 365, 3650)));
        store_type.push(t);
        ++idx;
    }

    return {
        store_id,
        store_name,
        region,
        city,
        opened_date: new Float64Array(opened_date_ms),
        store_type,
    };
}

// ─── 2) Products ──────────────────────────────────────────────────────────────

export interface Product {
    product_id: string;
    product_name: string;
    category: string;
    subcategory: string;
    brand: string;
    launch_date: string;
    list_price: number;
    unit_cost: number;
    is_discontinued: boolean;
    uom: string;
    pack_size: number;
    variant: string;
}

export interface ProductData {
    product_id: string[];
    product_name: string[];
    category: string[];
    subcategory: string[];
    brand: string[];
    launch_date: Float64Array; // ms
    list_price: Float64Array;
    unit_cost: Float64Array;
    is_discontinued: boolean[];
    uom: string[];
    pack_size: Float64Array;
    variant: string[];
}

// ── Optimisation #3 + #4: template lookup tables + pre-allocated arrays ──
// genProducts now indexes into TEMPLATE_UOM_PACK/TEMPLATE_PRICE_RANGE via
// subcategory and template indices, eliminating string scans. Arrays are
// pre-allocated with known size and written by index instead of push().

// Pre-compute suffix price multipliers to avoid per-product regex/includes
const SUFFIX_MULT: Record<string, number> = {
    Standard: 1,
    Pro: 1.06,
    Plus: 1.03,
    Bulk: 0.92,
    Eco: 0.95,
    Premium: 1.1,
};

function genProducts(rng: RNG, n: number, endMs: number): ProductData {
    // Per-table arena: 4 × Float64(n) = 32n bytes
    const arena = new DemoArena(32 * n);
    const product_id: string[] = new Array(n);
    const product_name: string[] = new Array(n);
    const category: string[] = new Array(n);
    const subcategory: string[] = new Array(n);
    const brand: string[] = new Array(n);
    const launch_date = arena.float64(n);
    const list_price = arena.float64(n);
    const unit_cost = arena.float64(n);
    const is_discontinued: boolean[] = new Array(n);
    const uom: string[] = new Array(n);
    const pack_size = arena.float64(n);
    const variant: string[] = new Array(n);

    for (let i = 0; i < n; ++i) {
        const sc = pickCumW(rng, SUBCATS, SUBCAT_CUMW);
        const b = pickCumW(rng, BRANDS, BRAND_CUMW);
        const scVariants = VARIANTS[sc];
        const v = pick(rng, scVariants);

        // Pick template by index so we can look up UOM/pack and price range directly
        const scIdx = SUBCATS.indexOf(sc);
        const templates = NAME_TEMPLATES[sc];
        const tmplIdx = randInt(rng, 0, templates.length);
        const tmpl = templates[tmplIdx];
        const suffix = pick(rng, SUFFIXES);
        const name = tmpl.replace('{v}', v) + ' ' + suffix;

        // Direct lookup instead of string scanning
        const [uomVal, packSizeVal] = TEMPLATE_UOM_PACK[scIdx][tmplIdx];
        const [pMin, pMax] = TEMPLATE_PRICE_RANGE[scIdx][tmplIdx];

        // launch date biased to recent (u² × 36 months)
        const u = rng();
        const daysAgo = Math.floor(u * u * 36 * 30);
        const launchMs = endMs - daysMs(daysAgo);

        let price = randFloat(rng, pMin, pMax);

        // Apply suffix-based price multiplier (replaces toLowerCase+includes per suffix)
        price *= SUFFIX_MULT[suffix];

        const listPrice = Math.round(Math.min(Math.max(price, 0.99), 320) * 100) / 100;

        const costMult = sc === 'Printing & Imaging' ? randFloat(rng, 0.65, 0.85) : randFloat(rng, 0.45, 0.72);
        const unitCost = Math.round(Math.min(listPrice * costMult, listPrice - 0.01) * 100) / 100;

        const isDiscontinued = rng() < 0.06;

        product_id[i] = `P${i + 1}`;
        product_name[i] = name;
        category[i] = CATEGORY_BY_SUBCAT[sc];
        subcategory[i] = sc;
        brand[i] = b;
        launch_date[i] = launchMs;
        list_price[i] = listPrice;
        unit_cost[i] = unitCost;
        is_discontinued[i] = isDiscontinued;
        uom[i] = uomVal;
        pack_size[i] = packSizeVal;
        variant[i] = v;
    }

    return {
        product_id,
        product_name,
        category,
        subcategory,
        brand,
        launch_date,
        list_price,
        unit_cost,
        is_discontinued,
        uom,
        pack_size,
        variant,
    };
}

// ─── 3) Customers ─────────────────────────────────────────────────────────────

export interface Customer {
    customer_id: string;
    customer_name: string;
    email: string;
    signup_date: string;
    region: string;
    segment: string;
    is_active: boolean;
    industry: string;
}

export interface CustomerData {
    customer_id: string[];
    customer_name: string[];
    email: string[];
    signup_date: Float64Array; // ms
    region: string[];
    segment: string[];
    is_active: boolean[];
    industry: string[];
}

function makeEmail(rng: RNG, company: string, region: string): string {
    const dom = slugCompany(company);
    const tlds = TLD_BY_REGION[region] ?? ['com'];
    // Use pre-built cumulative weight array for TLD selection
    const tldCumW = TLD_CUMW[region];
    const tld = tldCumW != null ? pickCumW(rng, tlds, tldCumW) : tlds[0];

    const fn = pick(rng, FIRST_NAMES).toLowerCase();
    const ln = pick(rng, LAST_NAMES).toLowerCase();
    const dept = pick(rng, DEPARTMENTS);

    const pat = pickCumW(rng, EMAIL_PATTERNS, EMAIL_PATTERN_CUMW);
    let local: string;
    if (pat === 'first.last') {
        local = `${fn}.${ln}`;
    } else if (pat === 'firstlast') {
        local = `${fn}${ln}`;
    } else if (pat === 'f.last') {
        local = `${fn[0]}.${ln}`;
    } else if (pat === 'dept') {
        local = dept;
    } else {
        local = `${dept}.${fn}${ln}`;
    }

    if (rng() < 0.12) {
        local = `${local}${randInt(rng, 2, 99)}`;
    }

    return `${local}@${dom}.${tld}`;
}

const ADJECTIVES = [
    'North',
    'Green',
    'Blue',
    'Prime',
    'Metro',
    'Summit',
    'Crescent',
    'Vertex',
    'Silver',
    'Beacon',
    'Apex',
    'Harbour',
    'Oak',
] as const;
const NOUNS = [
    'Systems',
    'Group',
    'Holdings',
    'Solutions',
    'Partners',
    'Industries',
    'Labs',
    'Networks',
    'Care',
    'Logistics',
    'Foods',
    'Energy',
    'Services',
] as const;
const LEGAL_SUFFIXES = ['Ltd', 'GmbH', 'AB', 'Inc', 'LLC', 'PLC', 'SAS', 'BV'] as const;

// ── Optimisation #7: pre-allocated arrays in genCustomers ──

function genCustomers(rng: RNG, n: number, endMs: number): CustomerData {
    // Per-table arena: 1 × Float64(n) = 8n bytes
    const arena = new DemoArena(8 * n);
    const customer_id: string[] = new Array(n);
    const customer_name: string[] = new Array(n);
    const email: string[] = new Array(n);
    const signup_date = arena.float64(n);
    const region: string[] = new Array(n);
    const segment: string[] = new Array(n);
    const is_active: boolean[] = new Array(n);
    const industry: string[] = new Array(n);

    for (let i = 0; i < n; ++i) {
        const r = pickCumW(rng, REGIONS, REGION_CUMW);
        const ind = pickCumW(rng, INDUSTRIES, INDUSTRY_CUMW);
        const seg = pickCumW(rng, SEGMENTS, SEG_CUMW);

        const u = rng();
        const signupMs = endMs - daysMs(Math.floor(u * u * 2100));

        const name = `${pick(rng, ADJECTIVES)} ${pick(rng, NOUNS)} ${pick(rng, LEGAL_SUFFIXES)}`;
        const em = makeEmail(rng, name, r);

        const activeThresh = seg === 'Enterprise' ? 0.96 : seg === 'Mid-Market' ? 0.93 : 0.88;
        const active = rng() < activeThresh;

        customer_id[i] = `C${i + 1}`;
        customer_name[i] = name;
        email[i] = em;
        signup_date[i] = signupMs;
        region[i] = r;
        segment[i] = seg;
        is_active[i] = active;
        industry[i] = ind;
    }

    return {
        customer_id,
        customer_name,
        email,
        signup_date,
        region,
        segment,
        is_active,
        industry,
    };
}

// ─── 4) Orders ────────────────────────────────────────────────────────────────

export interface Order {
    order_id: string;
    customer_id: string;
    store_id: string;
    order_datetime: string;
    channel: string;
    status: string;
    currency: string;
    price_list: string;
    discount_reason: string;
    payment_method: string;
    payment_terms: string;
    notes: string | null;
    promo_code: null;
}

export interface OrderData {
    order_id: DictColumn;
    customer_id: DictColumn;
    store_id: DictColumn;
    order_datetime: Float64Array; // ms (replaces the old orderMsArr)
    order_month: DictColumn; // pre-computed 'YYYY-MM'
    order_year: DictColumn; // pre-computed 'YYYY' string
    channel: DictColumn;
    status: DictColumn;
    currency: DictColumn;
    price_list: DictColumn;
    discount_reason: DictColumn;
    payment_method: DictColumn;
    payment_terms: DictColumn;
    notes: DictColumn;
    promo_code: DictColumn;
}

function genOrders(rng: RNG, customers: CustomerData, stores: StoreData, n: number, endMs: number): OrderData {
    // Per-table arena: 1×Float64(n) + 3×Uint32(n) + 11×Uint8(n) = 31n bytes
    const arena = new DemoArena(31 * n);
    // Status pool: proportions from original Python script (56200/60000, 2200/60000, 600/60000, 1000/60000).
    // indices: 0=Completed, 1=Cancelled, 2=Returned, 3=Processing
    const STATUS_VALS = ['Completed', 'Cancelled', 'Returned', 'Processing'] as const;
    const nCancelled = Math.round(n * (2_200 / 60_000));
    const nReturned = Math.round(n * (600 / 60_000));
    const nProcessing = Math.round(n * (1_000 / 60_000));
    const nCompleted = n - nCancelled - nReturned - nProcessing;
    const statusPool: number[] = [
        ...Array(nCompleted).fill(0), // Completed
        ...Array(nCancelled).fill(1), // Cancelled
        ...Array(nReturned).fill(2), // Returned
        ...Array(nProcessing).fill(3), // Processing
    ];
    shuffle(rng, statusPool);

    // Customer sampling weighted by segment (SMB=1, Mid-Market=2, Enterprise=5)
    const nCusts = customers.customer_id.length;
    const segTotal = customers.segment.reduce((a, seg) => a + (seg === 'SMB' ? 1 : seg === 'Mid-Market' ? 2 : 5), 0);
    const segCumW = new Float64Array(nCusts);
    {
        let s = 0;
        for (let i = 0; i < nCusts; ++i) {
            const seg = customers.segment[i];
            s += (seg === 'SMB' ? 1 : seg === 'Mid-Market' ? 2 : 5) / segTotal;
            segCumW[i] = s;
        }
    }

    function pickCustomer(): number {
        const r = rng();
        let lo = 0;
        let hi = segCumW.length - 1;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (segCumW[mid] < r) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        return lo;
    }

    // Monthly window from Jan 2021 to the end date, with seasonality and year-growth weights
    const months: { year: number; month: number }[] = [];
    const endDt = new Date(endMs);
    {
        let y = endDt.getUTCFullYear(),
            m = endDt.getUTCMonth() + 1;
        const startYear = 2021;
        const startMonth = 1;
        while (y > startYear || (y === startYear && m >= startMonth)) {
            months.unshift({ year: y, month: m });
            if (--m === 0) {
                m = 12;
                --y;
            }
        }
    }

    // Precompute days-per-month (avoids new Date inside the loop). The end month runs only to the end date.
    const monthDays = months.map(({ year: y, month: m }) => new Date(y, m, 0).getDate());
    const endIdx = months.length - 1;
    const endMonthShare = endDt.getUTCDate() / monthDays[endIdx];
    monthDays[endIdx] = endDt.getUTCDate();
    // Only the end date's own day can run past it. An order picked after the end is pulled back within
    // that day, so it keeps the month and year it was picked for.
    const endSecondsIntoDay = Math.floor(
        (endMs - Date.UTC(endDt.getUTCFullYear(), endDt.getUTCMonth(), endDt.getUTCDate())) / 1000
    );

    // Early hypergrowth, then a steady 10% a year from 2024.
    const yearGrowth: Record<number, number> = { 2021: 0.55, 2022: 0.7, 2023: 0.85 };
    const monthWeights = months.map(({ year: y, month: m }, i) => {
        let w = (yearGrowth[y] ?? 0.85 * 1.1 ** (y - 2023)) * (i === endIdx ? endMonthShare : 1);
        if (m === 10 || m === 11 || m === 12) {
            w *= 1.2;
        }
        if (m === 12) {
            w *= 1.1;
        }
        if (m === 7 || m === 8) {
            w *= 0.9;
        }
        if (m === 1) {
            w *= 1.05;
        }
        return w;
    });
    const monthWTotal = monthWeights.reduce((a, b) => a + b, 0);
    const length = monthWeights.length;
    const monthCumW = new Float64Array(length);
    {
        let s = 0;
        for (let i = 0; i < length; ++i) {
            s += monthWeights[i] / monthWTotal;
            monthCumW[i] = s;
        }
    }

    // Hour weights: business hours bias
    const hourCumW = new Float64Array(24);
    {
        const hourTotal = 6 * 0.3 + 10 * 2.2 + 3 * 0.6 + 5 * 0.3; // precomputed sum
        let s = 0;
        for (let h = 0; h < 24; ++h) {
            const w = h >= 8 && h < 18 ? 2.2 : h >= 18 && h < 21 ? 0.6 : 0.3;
            s += w / hourTotal;
            hourCumW[h] = s;
        }
    }

    // ── Optimisation #6: binary search for pickHour and pickMonthIdx ──
    // pickCumWIdx replaces the integer range arrays - returns the index directly.

    // Store lookup by region - built from StoreData column arrays using indices
    const fulfilByRegion: Record<string, number[]> = {};
    const allByRegion: Record<string, number[]> = {};
    const partnerByRegion: Record<string, number[]> = {};
    for (const r of REGIONS) {
        fulfilByRegion[r] = [];
        partnerByRegion[r] = [];
        allByRegion[r] = [];
    }
    const length2 = stores.store_id.length;
    for (let si = 0; si < length2; ++si) {
        const r = stores.region[si];
        const t = stores.store_type[si];
        allByRegion[r].push(si);
        if (t === 'Fulfilment') {
            fulfilByRegion[r].push(si);
        } else if (t === 'Partner Depot') {
            partnerByRegion[r].push(si);
        }
    }

    const CHANNELS = ['Portal', 'Sales-Assisted', 'Partner', 'In-person'] as const;
    const CHANNEL_W_SMB = [0.7, 0.2, 0.08, 0.02] as const;
    const CHANNEL_W_MID = [0.55, 0.25, 0.15, 0.05] as const;
    const CHANNEL_W_ENT = [0.35, 0.35, 0.25, 0.05] as const;
    // Pre-built cumulative weight arrays for channel selection by segment
    const CHANNEL_CUMW_SMB = buildCumW(CHANNEL_W_SMB);
    const CHANNEL_CUMW_MID = buildCumW(CHANNEL_W_MID);
    const CHANNEL_CUMW_ENT = buildCumW(CHANNEL_W_ENT);

    const PRICE_LISTS = ['Contract', 'Volume', 'List'] as const;
    const PL_W_ENT = [0.6, 0.25, 0.15] as const;
    const PL_W_MID = [0.45, 0.2, 0.35] as const;
    const PL_W_SMB = [0.2, 0.15, 0.65] as const; // reversed for SMB: List,Contract,Volume → use fixed order
    // Pre-built cumulative weight arrays for price list selection by segment
    const PL_CUMW_ENT = buildCumW(PL_W_ENT);
    const PL_CUMW_MID = buildCumW(PL_W_MID);
    const PL_CUMW_SMB = buildCumW(PL_W_SMB);

    const PAYMENT_METHODS = ['Invoice', 'Bank Transfer', 'Card'] as const;
    const PAYMENT_METHOD_W = [0.78, 0.15, 0.07] as const;
    const PAYMENT_METHOD_CUMW = buildCumW(PAYMENT_METHOD_W);
    const PAYMENT_TERMS = ['Net 30', 'Net 45', 'Net 60'] as const;
    const PAYMENT_TERMS_W = [0.55, 0.3, 0.15] as const;
    const PAYMENT_TERMS_CUMW = buildCumW(PAYMENT_TERMS_W);
    const NOTES_OPTIONS = ['PO required', 'Deliver to goods-in', 'Leave at reception', 'Urgent replacement'] as const;
    const DISC_REASONS_CONTRACT_CUMW = buildCumW([0.8, 0.12, 0.08]);
    // discount_reason vocab: Contract=0, Renewal=1, Bundle=2, Volume=3, None=4
    const DISC_REASON_VALS = ['Contract', 'Renewal', 'Bundle', 'Volume', 'None'] as const;

    const CURRENCY_VALS = ['GBP', 'EUR', 'USD'] as const;

    // Pre-allocate typed index arrays - all from arena (single ArrayBuffer).
    const order_datetime = arena.float64(n);
    const order_id_indices = arena.uint32(n);
    const order_id_vals: string[] = new Array(n);
    const customer_id_indices = arena.uint32(n);
    const store_id_indices = arena.uint32(n);
    const order_month_indices = arena.uint8(n);
    const channel_indices = arena.uint8(n);
    const status_indices = arena.uint8(n);
    const currency_indices = arena.uint8(n);
    const price_list_indices = arena.uint8(n);
    const disc_reason_indices = arena.uint8(n);
    const payment_method_indices = arena.uint8(n);
    const payment_terms_indices = arena.uint8(n);
    const notes_indices = arena.uint8(n); // 0 = placeholder for null rows
    let notesNullCount = 0;

    for (let i = 0; i < n; ++i) {
        const custIdx = pickCustomer();
        const custRegion = customers.region[custIdx];
        const custSegment = customers.segment[custIdx];

        const currIdx = custRegion === 'UK' ? 0 : custRegion === 'DACH' || custRegion === 'Nordics' ? 1 : 2; // GBP=0, EUR=1, USD=2

        const channelCumW =
            custSegment === 'SMB'
                ? CHANNEL_CUMW_SMB
                : custSegment === 'Mid-Market'
                  ? CHANNEL_CUMW_MID
                  : CHANNEL_CUMW_ENT;
        const chIdx = pickCumWIdx(rng, channelCumW);

        // Order datetime - use pickCumWIdx for month and hour
        const mIdx = pickCumWIdx(rng, monthCumW);
        const { year: my, month: mm } = months[mIdx];
        const day = randInt(rng, 1, monthDays[mIdx] + 1);
        const hour = pickCumWIdx(rng, hourCumW);
        let orderMs = Date.UTC(my, mm - 1, day, hour, randInt(rng, 0, 60), randInt(rng, 0, 60));
        if (orderMs > endMs) {
            orderMs = endMs - randInt(rng, 0, endSecondsIntoDay + 1) * 1000;
        }

        // Store - write store index directly
        let storeIdx: number;
        const ch = CHANNELS[chIdx];
        if (ch === 'Partner') {
            const partners = partnerByRegion[custRegion];
            storeIdx = partners.length > 0 && rng() < 0.7 ? pick(rng, partners) : pick(rng, fulfilByRegion[custRegion]);
        } else {
            storeIdx = rng() < 0.85 ? pick(rng, fulfilByRegion[custRegion]) : pick(rng, allByRegion[custRegion]);
        }

        // Price list - uses pre-built cumulative weight arrays
        const plCumW =
            custSegment === 'Enterprise' ? PL_CUMW_ENT : custSegment === 'Mid-Market' ? PL_CUMW_MID : PL_CUMW_SMB;
        const plIdx = pickCumWIdx(rng, plCumW);
        const pl = PRICE_LISTS[plIdx];

        let discReasonIdx: number;
        if (pl === 'Contract') {
            // Contract=0, Renewal=1, Bundle=2
            discReasonIdx = pickCumWIdx(rng, DISC_REASONS_CONTRACT_CUMW);
        } else if (pl === 'Volume') {
            discReasonIdx = rng() < 0.85 ? 3 : 2; // Volume=3, Bundle=2
        } else {
            discReasonIdx = 4; // None=4
        }

        const note = rng() < 0.04 ? pick(rng, NOTES_OPTIONS) : null;

        order_id_vals[i] = `O${i + 1}`;
        order_id_indices[i] = i;
        customer_id_indices[i] = custIdx;
        store_id_indices[i] = storeIdx;
        order_datetime[i] = orderMs;
        // ── Optimisation #2: use already-computed mIdx - no string allocation per order ──
        order_month_indices[i] = mIdx;
        channel_indices[i] = chIdx;
        status_indices[i] = statusPool[i];
        currency_indices[i] = currIdx;
        price_list_indices[i] = plIdx;
        disc_reason_indices[i] = discReasonIdx;
        payment_method_indices[i] = pickCumWIdx(rng, PAYMENT_METHOD_CUMW);
        payment_terms_indices[i] = pickCumWIdx(rng, PAYMENT_TERMS_CUMW);
        if (note != null) {
            notes_indices[i] = NOTES_OPTIONS.indexOf(note);
        } else {
            ++notesNullCount;
        }
    }

    const monthStrs = months.map(({ year: y, month: m }) => `${y}-${p2(m)}`);

    const uniqueYears = [...new Set(months.map(({ year: y }) => y))].sort((a, b) => a - b);
    const yearStrs = uniqueYears.map(String);
    const monthToYearIdx = months.map(({ year: y }) => uniqueYears.indexOf(y));
    const order_year_indices = arena.uint8(n);
    for (let i = 0; i < n; ++i) {
        order_year_indices[i] = monthToYearIdx[order_month_indices[i]];
    }

    return {
        order_id: { indices: order_id_indices, indexToValue: order_id_vals, nullCount: 0 },
        customer_id: { indices: customer_id_indices, indexToValue: customers.customer_id, nullCount: 0 },
        store_id: { indices: store_id_indices, indexToValue: stores.store_id, nullCount: 0 },
        order_datetime,
        order_month: { indices: order_month_indices, indexToValue: monthStrs, nullCount: 0 },
        order_year: { indices: order_year_indices, indexToValue: yearStrs, nullCount: 0 },
        channel: { indices: channel_indices, indexToValue: [...CHANNELS], nullCount: 0 },
        status: { indices: status_indices, indexToValue: [...STATUS_VALS], nullCount: 0 },
        currency: { indices: currency_indices, indexToValue: [...CURRENCY_VALS], nullCount: 0 },
        price_list: { indices: price_list_indices, indexToValue: [...PRICE_LISTS], nullCount: 0 },
        discount_reason: { indices: disc_reason_indices, indexToValue: [...DISC_REASON_VALS], nullCount: 0 },
        payment_method: { indices: payment_method_indices, indexToValue: [...PAYMENT_METHODS], nullCount: 0 },
        payment_terms: { indices: payment_terms_indices, indexToValue: [...PAYMENT_TERMS], nullCount: 0 },
        notes: { indices: notes_indices, indexToValue: [...NOTES_OPTIONS], nullCount: notesNullCount },
        promo_code: { indices: arena.uint8(n), indexToValue: [], nullCount: n },
    };
}

// ─── 5) Order Items ───────────────────────────────────────────────────────────

export interface OrderItem {
    order_item_id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_pct: number;
    tax_rate: number;
    returned: boolean;
    return_reason: string | null;
}

export interface OrderItemData {
    order_item_id: DictColumn;
    order_id: DictColumn;
    product_id: DictColumn;
    quantity: Float64Array;
    unit_price: Float64Array;
    discount_pct: Float64Array;
    tax_rate: Float64Array;
    returned: boolean[];
    return_reason: DictColumn;
}

const CAP_BY_UOM: Record<string, number> = { case: 70, box: 90, pack: 110, roll: 80 };

const QTY_BASES: Record<string, readonly [number, number, number]> = {
    'Paper & Notebooks': [6, 14, 28],
    'Labels & Mailing': [4, 12, 24],
    'Cleaning & Facilities (Office)': [4, 12, 22],
    'Writing Instruments': [3, 10, 18],
    'Filing & Organisation': [3, 9, 16],
    'Binders & Presentation': [3, 9, 16],
    'Printing & Imaging': [2, 5, 10],
    'Desk Accessories': [1, 3, 6],
};
const QTY_BASES_DEFAULT: readonly [number, number, number] = [3, 8, 14];

/** Returns the upper bound for uniform quantity sampling in [1, max]. */
function qtyMax(subcat: string, segment: string, uom: string): number {
    const base = QTY_BASES[subcat] ?? QTY_BASES_DEFAULT;
    const med = segment === 'Enterprise' ? base[2] : segment === 'Mid-Market' ? base[1] : base[0];
    const cap = uom === 'each' ? (segment === 'Enterprise' ? 12 : 6) : (CAP_BY_UOM[uom] ?? 25);
    return Math.min(med * 2, cap);
}

const RETURN_REASONS = ['Damaged', 'Incorrect spec', 'Over-ordered', 'Warranty claim'] as const;

export function genOrderItems(
    rng: RNG,
    orders: OrderData,
    customers: CustomerData,
    products: ProductData
): OrderItemData {
    const nOrders = orders.order_id.indices.length;
    const nItems = computeItemCount(nOrders);
    // Per-table arena: 4×Float64(nItems) + 3×Uint32(nItems) + 1×Uint8(nItems) = 45×nItems bytes
    const arena = new DemoArena(45 * nItems);

    // Assign line counts using proportions from the SF=1 baseline (20k/45k/55k/60k).
    const t2 = Math.round(nOrders * (20_000 / 60_000));
    const t3 = Math.round(nOrders * (45_000 / 60_000));
    const t4 = Math.round(nOrders * (55_000 / 60_000));
    const counts = new Uint8Array(nOrders);
    // Optimisation #5: typed-array permutation
    const perm = permutation(rng, nOrders);
    for (let i = 0; i < t2; ++i) {
        counts[perm[i]] = 2;
    }
    for (let i = t2; i < t3; ++i) {
        counts[perm[i]] = 3;
    }
    for (let i = t3; i < t4; ++i) {
        counts[perm[i]] = 4;
    }
    for (let i = t4; i < nOrders; ++i) {
        counts[perm[i]] = 5;
    }

    // Build cumulative start offsets
    const orderStart = new Int32Array(nOrders);
    for (let i = 1; i < nOrders; ++i) {
        orderStart[i] = orderStart[i - 1] + counts[i - 1];
    }

    // Product lookup arrays
    const prodIds = products.product_id;
    const prodSubcats = products.subcategory;
    const prodUoms = products.uom;
    const prodPrices = products.list_price;
    const nProds = prodIds.length;

    // Index by subcat
    const subToIdx: Record<string, number[]> = {};
    for (const sc of SUBCATS) {
        subToIdx[sc] = [];
    }
    for (let i = 0; i < nProds; ++i) {
        subToIdx[prodSubcats[i]].push(i);
    }

    // Output arrays - all from arena. nItems is the exact count (pre-computed from
    // line-count proportions), so no over-allocation or slicing needed.
    const quantity = arena.float64(nItems);
    const unit_price = arena.float64(nItems);
    const discount_pct = arena.float64(nItems);
    const tax_rate = arena.float64(nItems);
    const order_item_id_indices = arena.uint32(nItems);
    const order_item_id_vals: string[] = new Array(nItems);
    const order_id_indices = arena.uint32(nItems);
    const product_id_indices = arena.uint32(nItems);
    const return_reason_indices = arena.uint8(nItems); // 0 = placeholder for null rows
    const returned: boolean[] = new Array(nItems).fill(false);
    let returnReasonNullCount = nItems; // start all-null, decrement as reasons are set
    let ptr = 0;

    // Product selection pass - uses pickCumW with pre-built SUBCAT_CUMW
    // Scratch array - heap-allocated, collected after generation.
    const productIdxArr = new Int32Array(nItems);

    for (let oi = 0; oi < nOrders; ++oi) {
        const c = counts[oi];
        const dominant = pickCumW(rng, SUBCATS, SUBCAT_CUMW);
        const pool = subToIdx[dominant];
        productIdxArr[ptr] = pool[randInt(rng, 0, pool.length)];
        for (let j = 1; j < c; ++j) {
            productIdxArr[ptr + j] = rng() < 0.7 ? pool[randInt(rng, 0, pool.length)] : randInt(rng, 0, nProds);
        }
        ptr += c;
    }

    // Quantities, prices, discounts
    ptr = 0;
    for (let oi = 0; oi < nOrders; ++oi) {
        const c = counts[oi];
        // Look up customer segment via orders.customer_id index
        const custIdx = orders.customer_id.indices[oi];
        const segment = customers.segment[custIdx];
        const pl = getDictVal(orders.price_list, oi);
        const curr = getDictVal(orders.currency, oi);
        const st = getDictVal(orders.status, oi);

        const fx = curr === 'EUR' ? 1.12 : curr === 'USD' ? 1.25 : 1;

        const plMult =
            pl === 'Contract'
                ? randFloat(rng, 0.9, 0.98)
                : pl === 'Volume'
                  ? randFloat(rng, 0.88, 0.96)
                  : randFloat(rng, 0.98, 1.03);

        for (let j = 0; j < c; ++j) {
            const pidx = productIdxArr[ptr];
            const subcat = prodSubcats[pidx];
            const uom = prodUoms[pidx];
            const base = prodPrices[pidx] * fx;

            const qty = randInt(rng, 1, qtyMax(subcat, segment, uom) + 1);

            const qtyBreak = 1 - Math.min(Math.max((qty - 10) / 200, 0), 0.18);
            const noise = randFloat(rng, 0.985, 1.02);
            const unitPriceVal = Math.round(base * plMult * qtyBreak * noise * 100) / 100;

            let disc =
                pl === 'Contract'
                    ? randFloat(rng, 0.04, 0.14)
                    : pl === 'Volume'
                      ? randFloat(rng, 0.06, 0.2)
                      : randFloat(rng, 0, 0.06);
            disc += Math.min(Math.max((qty - 20) / 260, 0), 0.1) * randFloat(rng, 0.6, 1);
            if (st === 'Cancelled') {
                disc = Math.min(disc, randFloat(rng, 0, 0.04));
            }
            disc = Math.round(Math.min(disc, 0.55) * 10_000) / 10_000;

            const taxRateVal = curr === 'USD' ? 0 : 0.2;

            order_item_id_indices[ptr] = ptr;
            order_item_id_vals[ptr] = `I${ptr + 1}`;
            order_id_indices[ptr] = oi;
            product_id_indices[ptr] = pidx;
            quantity[ptr] = qty;
            unit_price[ptr] = unitPriceVal;
            discount_pct[ptr] = disc;
            tax_rate[ptr] = taxRateVal;
            ++ptr;
        }
    }

    // Adjust returnReasonNullCount to reflect actual allocated rows
    returnReasonNullCount = nItems;

    // Returns: only for 'Returned' orders
    // Reusable scratch buffer (max 5 lines per order) avoids per-order allocation
    const lineIdxsBuf = [0, 1, 2, 3, 4];
    for (let oi = 0; oi < nOrders; ++oi) {
        if (getDictVal(orders.status, oi) !== 'Returned') {
            continue;
        }
        const c = counts[oi];
        const start = orderStart[oi];
        const k = rng() < 0.85 ? 1 : 2;
        // Partial Fisher-Yates on first c slots of the reusable buffer
        for (let j = 0; j < c; ++j) lineIdxsBuf[j] = j;
        for (let j = c - 1; j > 0; --j) {
            const r = randInt(rng, 0, j + 1);
            const tmp = lineIdxsBuf[j];
            lineIdxsBuf[j] = lineIdxsBuf[r];
            lineIdxsBuf[r] = tmp;
        }
        for (let j = 0; j < k && j < c; ++j) {
            const pos = start + lineIdxsBuf[j];
            returned[pos] = true;
            return_reason_indices[pos] = randInt(rng, 0, RETURN_REASONS.length);
            --returnReasonNullCount;
        }
        // Ensure at least one line is returned
        if (!returned[start]) {
            returned[start] = true;
            return_reason_indices[start] = randInt(rng, 0, RETURN_REASONS.length);
            --returnReasonNullCount;
        }
    }

    // Arena arrays are exact-sized - no slicing needed.
    return {
        order_item_id: {
            indices: order_item_id_indices,
            indexToValue: order_item_id_vals,
            nullCount: 0,
        },
        order_id: {
            indices: order_id_indices,
            indexToValue: orders.order_id.indexToValue,
            nullCount: 0,
        },
        product_id: {
            indices: product_id_indices,
            indexToValue: products.product_id,
            nullCount: 0,
        },
        quantity,
        unit_price,
        discount_pct,
        tax_rate,
        returned,
        return_reason: {
            indices: return_reason_indices,
            indexToValue: [...RETURN_REASONS],
            nullCount: returnReasonNullCount,
        },
    };
}

// ─── 6) Shipments ────────────────────────────────────────────────────────────

export interface Shipment {
    shipment_id: string;
    order_id: string;
    ship_datetime: string | null;
    delivery_datetime: string | null;
    carrier: string;
    delayed: boolean;
}

export interface ShipmentData {
    shipment_id: DictColumn;
    order_id: DictColumn;
    ship_datetime: Float64Array; // epoch ms, NaN for null (arena-backed)
    delivery_datetime: Float64Array; // epoch ms, NaN for null (arena-backed)
    carrier: DictColumn;
    delayed: boolean[];
}

const CARRIERS = ['DHL', 'DPD', 'Royal Mail', 'UPS'] as const;
const CARRIER_W = [0.3, 0.3, 0.25, 0.15] as const;
// Pre-built cumulative weight array for carrier selection
const CARRIER_CUMW = buildCumW(CARRIER_W);

const MEAN_TRANSIT_DAYS: Record<string, number> = { GBP: 2.5, EUR: 3.0, USD: 3.5 };
const DELAY_THRESH: Record<string, number> = { GBP: 4.5, EUR: 4.5, USD: 5.5 };

// ── Optimisation #7: pre-allocated arrays in genShipments ──

function genShipments(rng: RNG, orders: OrderData, nShipments: number, endMs: number): ShipmentData {
    // Per-table arena: 2×Float64 + 2×Uint32 + 1×Uint8 = 25×nShipments bytes (upper bound)
    const arena = new DemoArena(25 * nShipments);

    const nOrders = orders.order_id.indices.length;
    const idxReturned: number[] = [];
    const idxProcessing: number[] = [];
    const idxCompleted: number[] = [];
    for (let i = 0; i < nOrders; ++i) {
        const st = getDictVal(orders.status, i);
        if (st === 'Returned') {
            idxReturned.push(i);
        } else if (st === 'Processing') {
            idxProcessing.push(i);
        } else if (st === 'Completed') {
            idxCompleted.push(i);
        }
    }

    const need = nShipments - idxReturned.length - idxProcessing.length;
    shuffle(rng, idxCompleted);
    const selCompleted = idxCompleted.slice(0, need);

    const shipOrders = [...idxReturned, ...idxProcessing, ...selCompleted];
    shuffle(rng, shipOrders);

    const nShipOrders = shipOrders.length;

    // Float64 arrays first for alignment, then Uint32, then Uint8.
    const ship_datetime = arena.float64(nShipOrders);
    const delivery_datetime = arena.float64(nShipOrders);
    const shipment_id_indices = arena.uint32(nShipOrders);
    const shipment_id_vals: string[] = new Array(nShipOrders);
    const order_id_indices = arena.uint32(nShipOrders);
    const carrier_indices = arena.uint8(nShipOrders);
    const delayed: boolean[] = new Array(nShipOrders);

    for (let i = 0; i < nShipOrders; ++i) {
        const oi = shipOrders[i];
        const carrIdx = pickCumWIdx(rng, CARRIER_CUMW);
        const st = getDictVal(orders.status, oi);
        const curr = getDictVal(orders.currency, oi);

        shipment_id_indices[i] = i;
        shipment_id_vals[i] = `SH${i + 1}`;
        order_id_indices[i] = oi;
        carrier_indices[i] = carrIdx;

        // Some Processing orders not shipped yet
        if (st === 'Processing' && rng() < 0.35) {
            ship_datetime[i] = NaN;
            delivery_datetime[i] = NaN;
            delayed[i] = false;
            continue;
        }

        const shipHours = st === 'Processing' ? randFloat(rng, 0, 36) : randFloat(rng, 2, 60);
        const shipMs = orders.order_datetime[oi] + shipHours * 3_600_000;

        const meanDays = MEAN_TRANSIT_DAYS[curr] ?? 3;
        const transit = Math.min(Math.max(randNormal(rng, meanDays, 1.1), 0.6), 9);
        const delivMs = shipMs + transit * 86_400_000;

        ship_datetime[i] = shipMs;

        // Still in transit, so no delivery timestamp: either the order is open, or the
        // delivery would land past the end of the window. Only Processing orders can be
        // open - Completed and Returned orders have both been delivered.
        if (delivMs > endMs || (st === 'Processing' && rng() < 0.55)) {
            delivery_datetime[i] = NaN;
            delayed[i] = false;
            continue;
        }

        const thresh = DELAY_THRESH[curr] ?? 5;
        const month = msToMonth(shipMs);
        const isDelayed = transit > thresh || rng() < (month === 11 || month === 12 ? 0.1 : 0.07);

        delivery_datetime[i] = delivMs;
        delayed[i] = isDelayed;
    }

    return {
        shipment_id: { indices: shipment_id_indices, indexToValue: shipment_id_vals, nullCount: 0 },
        order_id: { indices: order_id_indices, indexToValue: orders.order_id.indexToValue, nullCount: 0 },
        ship_datetime,
        delivery_datetime,
        carrier: { indices: carrier_indices, indexToValue: [...CARRIERS], nullCount: 0 },
        delayed,
    };
}

// ─── Top-level entry ──────────────────────────────────────────────────────────

export interface DemoData {
    stores: StoreData;
    products: ProductData;
    customers: CustomerData;
    orders: OrderData;
    order_items: OrderItemData;
    shipments: ShipmentData;
}

/** Compute exact order-item count from line-count proportions (deterministic, no RNG). */
function computeItemCount(nOrders: number): number {
    const t2 = Math.round(nOrders * (20_000 / 60_000));
    const t3 = Math.round(nOrders * (45_000 / 60_000));
    const t4 = Math.round(nOrders * (55_000 / 60_000));
    return t2 * 2 + (t3 - t2) * 3 + (t4 - t3) * 4 + (nOrders - t4) * 5;
}

export function generateDemoData(
    createRng: (seed: string) => () => number = () => () => Math.random(),
    seed = SEED,
    sf = SCALE_FACTOR,
    endDate = END_DT
): DemoData {
    const rng = createRng(seed);
    const endMs = endDate.getTime();
    const nProducts = Math.max(Math.round(N_PRODUCTS * sf), SUBCATS.length);
    const nCustomers = Math.max(Math.round(N_CUSTOMERS * sf), 1);
    const nOrders = Math.max(Math.round(N_ORDERS * sf), 1);
    const nShipments = Math.round(N_SHIPMENTS * sf);

    // Each generator creates its own per-table arena. This avoids the single
    // upfront allocation spike (177MB at SF=0.5) that pushes V8 into large-object
    // space and delays scavenges. Per-table arenas allow V8 to collect generation
    // temporaries incrementally between tables.
    tracingStart('gen:data');

    tracingStart('gen:data:stores');
    const stores = genStores(rng, endMs);
    tracingEnd('gen:data:stores');
    tracingMeasure('gen:data:stores', { rows: stores.store_id.length });

    tracingStart('gen:data:products');
    const products = genProducts(rng, nProducts, endMs);
    tracingEnd('gen:data:products');
    tracingMeasure('gen:data:products', { rows: nProducts });

    tracingStart('gen:data:customers');
    const customers = genCustomers(rng, nCustomers, endMs);
    tracingEnd('gen:data:customers');
    tracingMeasure('gen:data:customers', { rows: nCustomers });

    tracingStart('gen:data:orders');
    const orders = genOrders(rng, customers, stores, nOrders, endMs);
    tracingEnd('gen:data:orders');
    tracingMeasure('gen:data:orders', { rows: nOrders });

    tracingStart('gen:data:order-items');
    const order_items = genOrderItems(rng, orders, customers, products);
    tracingEnd('gen:data:order-items');
    tracingMeasure('gen:data:order-items', { rows: order_items.order_item_id.indices.length });

    tracingStart('gen:data:shipments');
    const shipments = genShipments(rng, orders, nShipments, endMs);
    tracingEnd('gen:data:shipments');
    tracingMeasure('gen:data:shipments', { rows: nShipments });

    tracingEnd('gen:data');
    tracingMeasure('gen:data');

    return { stores, products, customers, orders, order_items, shipments };
}

// ─── Dictionary encoding ──────────────────────────────────────────────────────

/**
 * A pre-built dictionary column: typed index array + vocabulary array.
 * Passes directly to the engine's zero-copy ingestion path via `statsHints.indexToValue`.
 */
export interface DictColumn {
    indices: Uint8Array | Uint16Array | Uint32Array;
    indexToValue: string[];
    nullCount: number;
}

/**
 * Build a dictionary column from a string (or nullable string) array.
 * Uses the smallest index type that fits the vocabulary size.
 */
export function buildDict(values: ReadonlyArray<string | null>): DictColumn {
    const indexToValue: string[] = [];
    const termMap = new Map<string, number>();
    let nullCount = 0;
    for (const v of values) {
        if (v == null) {
            ++nullCount;
        } else if (!termMap.has(v)) {
            termMap.set(v, indexToValue.length);
            indexToValue.push(v);
        }
    }
    const size = indexToValue.length;
    const IndexArray = size <= 256 ? Uint8Array : size <= 65_536 ? Uint16Array : Uint32Array;
    const indices = new IndexArray(values.length);
    for (let i = 0; i < values.length; ++i) {
        const v = values[i];
        if (v != null) indices[i] = termMap.get(v)!;
    }
    return { indices, indexToValue, nullCount };
}

/** Decode a single value from a dictionary column. */
export function getDictVal(col: DictColumn, i: number): string {
    return col.indexToValue[col.indices[i]];
}

/** A table where string columns have been replaced with pre-built `DictColumn`s. */
export type EncodedTable = Record<string, DictColumn | ArrayLike<unknown>>;

/** All six demo tables with string columns pre-dictionary-encoded. */
export interface EncodedDemoData {
    stores: EncodedTable;
    products: EncodedTable;
    customers: EncodedTable;
    orders: EncodedTable;
    order_items: EncodedTable;
    shipments: EncodedTable;
}

function encodeStringCols(
    struct: Record<string, ArrayLike<unknown>>,
    stringFields: ReadonlyArray<string>
): EncodedTable {
    const result: EncodedTable = { ...struct };
    for (const f of stringFields) {
        const col = struct[f];
        if (col != null) {
            result[f] = buildDict(col as ReadonlyArray<string | null>);
        }
    }
    return result;
}

/**
 * Pre-encode all string columns across the six demo tables into dictionary form.
 * The result can be fed directly to `colsFromStruct` in `mainDemoData.ts`, which
 * detects `DictColumn` values and supplies `statsHints.indexToValue` so the engine
 * takes the zero-copy ingestion path instead of calling `buildStringColumn`.
 *
 * `orders`, `order_items`, and `shipments` already carry `DictColumn` fields built
 * inline by the generators - only the three small dimension tables need encoding here.
 */
export function encodeDemoData(data: DemoData): EncodedDemoData {
    return {
        stores: encodeStringCols(data.stores as any, ['store_id', 'store_name', 'region', 'city', 'store_type']),
        products: encodeStringCols(data.products as any, [
            'product_id',
            'product_name',
            'category',
            'subcategory',
            'brand',
            'uom',
            'variant',
        ]),
        customers: encodeStringCols(data.customers as any, [
            'customer_id',
            'customer_name',
            'email',
            'region',
            'segment',
            'industry',
        ]),
        // Large tables already have DictColumn fields - pass through directly.
        orders: data.orders as unknown as EncodedTable,
        order_items: data.order_items as unknown as EncodedTable,
        shipments: data.shipments as unknown as EncodedTable,
    };
}

// ─── Arena allocator ─────────────────────────────────────────────────────────
//
// Generators allocate output typed arrays from a single pre-sized ArrayBuffer,
// keeping all generated data as views into one contiguous allocation. This
// reduces GC roots from ~45 separate ArrayBuffers to 1 - the arena itself.
//
// Scratch arrays (permutations, cumulative weight tables) remain heap-allocated
// and are collected normally after generation completes.

function alignUp(offset: number, alignment: number): number {
    return (offset + alignment - 1) & ~(alignment - 1);
}

/**
 * Bump allocator over a single ArrayBuffer. All typed arrays returned are
 * views into the same backing store.
 */
export class DemoArena {
    private readonly buffer: ArrayBuffer;
    private offset = 0;

    constructor(bytes: number) {
        this.buffer = new ArrayBuffer(bytes);
    }

    float64(length: number): Float64Array {
        this.offset = alignUp(this.offset, 8);
        const view = new Float64Array(this.buffer, this.offset, length);
        this.offset += length * 8;
        return view;
    }

    uint32(length: number): Uint32Array {
        this.offset = alignUp(this.offset, 4);
        const view = new Uint32Array(this.buffer, this.offset, length);
        this.offset += length * 4;
        return view;
    }

    uint16(length: number): Uint16Array {
        this.offset = alignUp(this.offset, 2);
        const view = new Uint16Array(this.buffer, this.offset, length);
        this.offset += length * 2;
        return view;
    }

    uint8(length: number): Uint8Array {
        const view = new Uint8Array(this.buffer, this.offset, length);
        this.offset += length;
        return view;
    }
}

const traceEnabled = ((globalThis as any).agStudioDebug ?? []).includes('traceMarkers');

const tracingOptions = (label: string, details?: Record<string, unknown>) => {
    const split = label.split(':');
    const color = split[2] ? (split[3] ? 'tertiary' : 'secondary') : 'primary';
    const tooltipDetails = Object.keys(details ?? {})
        .map((k) => `${k}=${(details ?? {})[k]}`)
        .join(':');
    return {
        ...details,
        devtools: {
            dataType: 'track-entry',
            color,
            track: split[0],
            tooltipText: `${label} (${tooltipDetails})`,
            properties: details && Object.entries(details),
        },
    };
};

const noop = () => {};
export const tracingStart = traceEnabled
    ? (label: string, details?: Record<string, unknown>) => {
          return performance.mark(`ag:${label}-start`, { ...details, detail: tracingOptions(label, details) });
      }
    : noop;
export const tracingEnd = traceEnabled
    ? (label: string, details?: Record<string, unknown>) => {
          return performance.mark(`ag:${label}-end`, { ...details, detail: tracingOptions(label, details) });
      }
    : noop;

export const tracingMeasure = traceEnabled
    ? (label: string, details?: Record<string, unknown>) => {
          const firstProp = details ? Object.values(details)[0] : null;
          return performance.measure(`ag:${label}${firstProp ? `:${firstProp}` : ''}`, {
              detail: tracingOptions(label, details),
              start: `ag:${label}-start`,
              end: `ag:${label}-end`,
          });
      }
    : noop;
