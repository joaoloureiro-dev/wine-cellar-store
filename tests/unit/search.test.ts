import { describe, expect, it } from "vitest";

import { normalizeSearchText, parseSearchTerms, searchProducts } from "@/lib/catalog/search";
import { getProductFacts } from "@/lib/product-display";
import type { BaseProduct, Product, WineCellarProduct } from "@/types/product";

function product(overrides: Partial<WineCellarProduct>): WineCellarProduct {
    return {
        id: overrides.slug ?? "p",
        kind: "wine-cellar",
        slug: "p",
        sku: "SKU-1",
        name: "Modelo",
        brand: "Marca",
        brandSlug: "marca",
        categories: [],
        shortDescription: "Cave de vinho.",
        description: "Cave de vinho com prateleiras.",
        price: 499,
        capacity: 24,
        zones: 1,
        temperatureRanges: [{ min: 5, max: 18 }],
        installationType: "freestanding",
        dimensions: { width: 400, height: 850, depth: 550 },
        stockStatus: "in_stock",
        stockQuantity: 3,
        featured: false,
        active: true,
        images: ["/images/products/p.webp"],
        seo: { title: "", description: "" },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        ...overrides,
    };
}

const catalogue = [
    product({ slug: "classic-24", name: "Classic 24", brand: "La Sommelière", sku: "LS-CL-24", capacity: 24 }),
    product({ slug: "dual-zone-45", name: "Dual Zone 45", brand: "Avintage", sku: "AV-DZ-45", capacity: 45, zones: 2 }),
    product({
        slug: "integra-60",
        name: "Integra 60",
        brand: "Climadiff",
        sku: "CL-IN-60",
        capacity: 60,
        zones: 2,
        installationType: "built-in",
        shortDescription: "Cave silenciosa para encastrar em coluna.",
    }),
    product({ slug: "bar-140", name: "Bar 140", brand: "Climadiff", sku: "CL-BA-140", capacity: 140, zones: 3, installationType: "undercounter" }),
];

const slugs = (query: string) => searchProducts(catalogue, query)?.map((item) => item.slug);

describe("normalizeSearchText", () => {
    it("drops accents, case and punctuation", () => {
        expect(normalizeSearchText("  La Sommelière — ENCASTRÁVEL!  ")).toBe("la sommeliere encastravel");
    });
});

describe("parseSearchTerms", () => {
    it("turns zones and bottle counts into exact tags and ignores generic words", () => {
        expect(parseSearchTerms("Caves de vinho para 24 garrafas com 2 zonas")).toEqual([
            { kind: "tag", value: "g24" },
            { kind: "tag", value: "z2" },
        ]);
    });

    it("limits the number of terms", () => {
        expect(parseSearchTerms("um dois tres quatro cinco seis sete oito nove dez")).toHaveLength(8);
    });
});

describe("searchProducts", () => {
    it.each([
        ["classic", ["classic-24"]],
        ["sommeliere", ["classic-24"]],
        ["Sommelière", ["classic-24"]],
        ["climadiff", ["bar-140", "integra-60"]],
        ["encastrável", ["bar-140", "integra-60"]],
        ["sob bancada", ["bar-140"]],
        ["2 zonas", ["dual-zone-45", "integra-60"]],
        ["duas zonas encastravel", ["integra-60"]],
        ["24 garrafas", ["classic-24"]],
        ["24", ["classic-24"]],
        ["4", []],
        ["CL-IN-60", ["integra-60"]],
        ["clin60", ["integra-60"]],
        ["silenciosas", ["integra-60"]],
        ["avintage silenciosa", []],
        ["xyz", []],
    ])("%s → %o", (query, expected) => {
        expect(slugs(query)).toEqual(expected);
    });

    it("finds products by category name", () => {
        const items = [
            product({ slug: "service", categories: [{ slug: "caves-de-servico", name: "Caves de serviço" }] }),
            product({ slug: "other" }),
        ];

        expect(searchProducts(items, "serviço")?.map((item) => item.slug)).toEqual(["service"]);
    });

    it("ranks matches in the name above matches in the description", () => {
        const items = [
            product({ slug: "desc", name: "Alpha", description: "Uma cave tipo vinoteca." }),
            product({ slug: "name", name: "Vinoteca 30" }),
        ];

        expect(searchProducts(items, "vinoteca")?.map((item) => item.slug)).toEqual(["name", "desc"]);
    });

    it("returns null for an empty query and everything for generic words", () => {
        expect(searchProducts(catalogue, "   ")).toBeNull();
        expect(searchProducts(catalogue, "caves de vinho")).toHaveLength(catalogue.length);
    });
});

describe("searchProducts across kinds", () => {
    // Cellar fields left on the object are ignored by the other kinds.
    const base: BaseProduct = product({});
    const mixed: Product[] = [
        ...catalogue,
        { ...base, id: "room-25", slug: "room-25", kind: "climate-unit", name: "Wine Room 25", roomVolume: 25, coolingPower: 950 },
        { ...base, id: "modular-36", slug: "modular-36", kind: "wine-rack", name: "Modular 36", capacity: 36, material: "Madeira de pinho" },
        { ...base, id: "shelf", slug: "shelf", kind: "accessory", name: "Prateleira em faia" },
    ];
    const find = (query: string) => searchProducts(mixed, query)?.map((item) => item.slug);

    it("finds climate units, racks and accessories by what they are", () => {
        expect(find("climatizador")).toEqual(["room-25"]);
        expect(find("climatizadores de adega")).toEqual(["room-25"]);
        expect(find("garrafeira")).toEqual(["modular-36"]);
        expect(find("estante pinho")).toEqual(["modular-36"]);
        expect(find("acessórios")).toEqual(["shelf"]);
    });

    it("matches a rack's capacity like a cellar's", () => {
        expect(find("36 garrafas")).toEqual(["modular-36"]);
    });
});

describe("getProductFacts", () => {
    const base: BaseProduct = product({});

    it("shows each kind's key facts", () => {
        expect(getProductFacts(product({ zones: 2, temperatureRanges: [{ min: 5, max: 12 }, { min: 12, max: 18 }] }))).toEqual([
            { label: "Capacidade", value: "24 garrafas" },
            { label: "Zonas", value: "2 zonas" },
            { label: "Temperatura", value: "5–18 °C" },
        ]);
        expect(getProductFacts({ ...base, kind: "climate-unit", roomVolume: 25, coolingPower: 950 })).toEqual([
            { label: "Divisão até", value: "25 m³" },
            { label: "Potência", value: "950 W" },
        ]);
        expect(getProductFacts({ ...base, kind: "wine-rack", capacity: 36 })).toEqual([{ label: "Capacidade", value: "36 garrafas" }]);
        expect(getProductFacts({ ...base, kind: "accessory", dimensions: { width: 52, height: 4, depth: 45 } })).toEqual([
            { label: "Medidas", value: "52 × 4 × 45 cm" },
        ]);
    });
});
