import type { WineCellarProduct } from "@/types/product";

/**
 * Catalogue search.
 *
 * The active catalogue is small (a specialist store: tens to a few hundred
 * models) and already cached in full, so searching runs in memory over the
 * cached products: accent-insensitive, tolerant of plurals, with no extra
 * database load or extensions. If the catalogue grows into the thousands,
 * move this to PostgreSQL full-text search (unaccent + GIN index).
 */

export const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 8;

/** Words that describe every product in the store or carry no meaning. */
const STOP_WORDS = new Set([
    "a", "o", "as", "os", "e", "de", "da", "do", "das", "dos", "em", "na", "no", "para", "com", "por", "um", "uma",
    "cave", "caves", "vinho", "vinhos", "garrafeira", "garrafeiras", "frigorifico", "adega", "adegas",
]);

const installationKeywords: Record<WineCellarProduct["installationType"], string> = {
    freestanding: "livre instalacao independente",
    "built-in": "encastre encastravel encastrar embutir integravel",
    undercounter: "sob bancada encastre encastravel debaixo",
};

const zoneKeywords: Record<WineCellarProduct["zones"], string> = {
    1: "uma zona mono",
    2: "duas zonas dupla dual bizona",
    3: "tres zonas tripla multizona",
};

/** Lowercase, without accents or punctuation: "Encastrável" → "encastravel". */
export function normalizeSearchText(value: string) {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

type Term = { kind: "word"; stem: string } | { kind: "number"; value: string } | { kind: "tag"; value: string };

/** "2 zonas" and "24 garrafas" become exact tags; other numbers match whole words. */
export function parseSearchTerms(query: string): Term[] {
    const text = normalizeSearchText(query.slice(0, MAX_QUERY_LENGTH))
        .replace(/\buma zona\b/g, "z1")
        .replace(/\bduas zonas\b/g, "z2")
        .replace(/\btres zonas\b/g, "z3")
        .replace(/\b([1-3]) zonas?\b/g, "z$1")
        .replace(/\b(\d{1,4}) garrafas?\b/g, "g$1");

    const terms: Term[] = [];

    for (const word of text.split(" ")) {
        if (!word || STOP_WORDS.has(word)) continue;

        if (/^[zg]\d+$/.test(word)) terms.push({ kind: "tag", value: word });
        else if (/^\d+$/.test(word)) terms.push({ kind: "number", value: word });
        else if (word.length >= 2) terms.push({ kind: "word", stem: word.length > 3 ? word.replace(/s$/, "") : word });
    }

    return terms.slice(0, MAX_TERMS);
}

type Field = { words: string[]; weight: number };

function searchFields(product: WineCellarProduct): Field[] {
    const words = (text: string) => normalizeSearchText(text).split(" ").filter(Boolean);

    return [
        { words: words(product.name), weight: 6 },
        { words: [...words(product.brand), ...words(product.sku), normalizeSearchText(product.sku).replace(/ /g, "")], weight: 5 },
        {
            words: [
                ...words(installationKeywords[product.installationType]),
                ...words(zoneKeywords[product.zones]),
                `z${product.zones}`,
                `g${product.capacity}`,
                String(product.capacity),
            ],
            weight: 3,
        },
        { words: words(product.shortDescription), weight: 1 },
        { words: words(product.description), weight: 0.5 },
    ];
}

function termMatches(term: Term, word: string) {
    return term.kind === "word" ? word.startsWith(term.stem) : word === term.value;
}

/**
 * Products matching every term, best first. A term scores by the most
 * important field it appears in (name, then brand/SKU, then features,
 * then descriptions). An empty query returns null; one made only of
 * generic words ("caves de vinho") returns the whole catalogue.
 */
export function searchProducts(products: WineCellarProduct[], query: string): WineCellarProduct[] | null {
    const terms = parseSearchTerms(query);

    if (terms.length === 0) return normalizeSearchText(query) ? products : null;

    const scored: { product: WineCellarProduct; score: number }[] = [];

    for (const product of products) {
        const fields = searchFields(product);
        let score = 0;

        for (const term of terms) {
            const best = Math.max(0, ...fields.filter((field) => field.words.some((word) => termMatches(term, word))).map((field) => field.weight));

            if (best === 0) {
                score = 0;
                break;
            }

            score += best;
        }

        if (score > 0) scored.push({ product, score: score + (product.featured ? 0.1 : 0) });
    }

    return scored.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name, "pt")).map(({ product }) => product);
}
