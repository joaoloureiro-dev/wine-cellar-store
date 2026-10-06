import type { WineCellarProduct } from "../../types/product";

/** Seed products; `brandSlug` is resolved from the brand name when seeding. */
export type SeedProduct = Omit<WineCellarProduct, "brandSlug">;

export const products: SeedProduct[] = [
    {
        id: "cellar-001",

        slug: "classic-24",
        sku: "CELLAR-CLASSIC-24",

        name: "Classic 24",
        brand: "La Sommelière",

        shortDescription:
            "Cave de vinho compacta para conservação diária de pequenas coleções.",

        description:
            "Uma solução compacta e elegante para conservar vinho a uma temperatura estável, ideal para apartamentos, cozinhas e pequenas coleções.",

        price: 499,

        capacity: 24,
        zones: 1,

        temperatureRanges: [
            {
                min: 5,
                max: 20,
            },
        ],

        installationType: "freestanding",

        dimensions: {
            width: 43,
            height: 74,
            depth: 48,
        },

        weight: 28,

        energyClass: "G",

        noiseLevel: 38,

        reversibleDoor: true,
        uvProtectedGlass: true,
        ledLighting: true,
        lock: false,

        stockStatus: "in_stock",
        stockQuantity: 8,

        featured: true,
        active: true,

        images: [
            "/images/products/classic-24/front.webp",
        ],

        seo: {
            title: "Classic 24 | Cave de Vinho para 24 Garrafas",
            description:
                "Cave de vinho compacta para até 24 garrafas, com controlo de temperatura e porta com proteção UV.",
        },

        createdAt: "2026-09-18T00:00:00.000Z",
        updatedAt: "2026-09-18T00:00:00.000Z",
    },

    {
        id: "cellar-002",

        slug: "dual-zone-45",
        sku: "CELLAR-DUAL-45",

        name: "Dual Zone 45",
        brand: "Avintage",

        shortDescription:
            "Cave de dupla zona para conservar diferentes estilos de vinho.",

        description:
            "Uma cave de vinho de dupla zona pensada para quem pretende conservar vinho branco e vinho tinto a temperaturas distintas.",

        price: 899,

        capacity: 45,
        zones: 2,

        temperatureRanges: [
            {
                min: 5,
                max: 12,
            },
            {
                min: 12,
                max: 20,
            },
        ],

        installationType: "freestanding",

        dimensions: {
            width: 49,
            height: 84,
            depth: 57,
        },

        weight: 42,

        energyClass: "G",

        noiseLevel: 39,

        reversibleDoor: true,
        uvProtectedGlass: true,
        ledLighting: true,
        lock: true,

        stockStatus: "low_stock",
        stockQuantity: 3,

        featured: true,
        active: true,

        images: [
            "/images/products/dual-zone-45/front.webp",
        ],

        seo: {
            title: "Dual Zone 45 | Cave de Vinho Dupla Zona",
            description:
                "Cave de vinho para 45 garrafas com duas zonas de temperatura independentes.",
        },

        createdAt: "2026-09-18T00:00:00.000Z",
        updatedAt: "2026-09-18T00:00:00.000Z",
    },

    {
        id: "cellar-003",

        slug: "collection-109",
        sku: "CELLAR-COLLECTION-109",

        name: "Collection 109",
        brand: "Climadiff",

        shortDescription:
            "Cave de grande capacidade para coleções de vinho em crescimento.",

        description:
            "Uma cave de vinho de grande capacidade desenvolvida para colecionadores que necessitam de espaço, estabilidade térmica e organização.",

        price: 1499,

        compareAtPrice: 1699,

        capacity: 109,
        zones: 1,

        temperatureRanges: [
            {
                min: 5,
                max: 20,
            },
        ],

        installationType: "freestanding",

        dimensions: {
            width: 59,
            height: 127,
            depth: 67,
        },

        weight: 62,

        energyClass: "G",

        noiseLevel: 38,

        reversibleDoor: false,
        uvProtectedGlass: true,
        ledLighting: true,
        lock: true,

        stockStatus: "in_stock",
        stockQuantity: 5,

        featured: true,
        active: true,

        images: [
            "/images/products/collection-109/front.webp",
        ],

        seo: {
            title: "Collection 109 | Cave de Vinho para 109 Garrafas",
            description:
                "Cave de grande capacidade para conservar até 109 garrafas com temperatura controlada.",
        },

        createdAt: "2026-09-18T00:00:00.000Z",
        updatedAt: "2026-09-18T00:00:00.000Z",
    },
];