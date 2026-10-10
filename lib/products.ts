import "server-only";

import { cache } from "react";

import {
    InstallationType,
    ProductKind,
    StockStatus,
    type Prisma,
} from "@/generated/prisma/client";
import {
    buildCatalogOrderBy,
    buildCatalogWhere,
    defaultProductOrder,
} from "@/lib/catalog/prisma-query";
import { DEFAULT_SORT, type SortValue } from "@/lib/catalog/options";
import type { CatalogQuery } from "@/lib/catalog/query";
import { cacheCatalogData } from "@/lib/catalog/cache";
import { db } from "@/lib/db";
import type {
    InstallationType as DomainInstallationType,
    Product,
    ProductKind as DomainProductKind,
    StockStatus as DomainStockStatus,
    TemperatureZoneCount,
    WineCellarProduct,
} from "@/types/product";

/**
 * Product data access layer (PostgreSQL via Prisma).
 *
 * UI components only receive the WineCellarProduct domain type; database
 * details (cents, millimetres, enums, relations) never leak past this file.
 *
 * Every read goes through a 'use cache' scope tagged "catalog" (see
 * lib/catalog/cache.ts): results are shared across requests and refreshed
 * whenever stock, price or visibility changes.
 */

const productInclude = {
    brand: { select: { name: true, slug: true } },
    temperatureZones: { orderBy: { position: "asc" } },
    images: { orderBy: { position: "asc" } },
    categories: {
        select: { category: { select: { slug: true, name: true } } },
        orderBy: [{ category: { position: "asc" } }, { category: { name: "asc" } }],
    },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const installationTypes: Record<InstallationType, DomainInstallationType> = {
    FREESTANDING: "freestanding",
    BUILT_IN: "built-in",
    UNDERCOUNTER: "undercounter",
};

const stockStatuses: Record<StockStatus, DomainStockStatus> = {
    IN_STOCK: "in_stock",
    LOW_STOCK: "low_stock",
    OUT_OF_STOCK: "out_of_stock",
    PREORDER: "preorder",
};

const optional = <T>(value: T | null) => value ?? undefined;

const productKinds: Record<ProductKind, DomainProductKind> = {
    WINE_CELLAR: "wine-cellar",
    CLIMATE_UNIT: "climate-unit",
    WINE_RACK: "wine-rack",
    ACCESSORY: "accessory",
};

/** Dimensions in cm, when all three are known. */
function dimensionsOf(row: ProductRow) {
    return row.widthMm !== null && row.heightMm !== null && row.depthMm !== null
        ? { width: row.widthMm / 10, height: row.heightMm / 10, depth: row.depthMm / 10 }
        : undefined;
}

function toDomainProduct(row: ProductRow): Product {
    const base = {
        id: row.id,
        slug: row.slug,
        sku: row.sku,
        ean: optional(row.ean),
        name: row.name,
        brand: row.brand.name,
        brandSlug: row.brand.slug,
        categories: row.categories.map((entry) => entry.category),
        shortDescription: row.shortDescription,
        description: row.description,
        price: row.priceCents / 100,
        compareAtPrice: row.compareAtPriceCents === null ? undefined : row.compareAtPriceCents / 100,
        weight: row.weightGrams === null ? undefined : row.weightGrams / 1000,
        energyClass: optional(row.energyClass),
        annualEnergyConsumption: optional(row.annualEnergyKwh),
        noiseLevel: optional(row.noiseDb),
        stockStatus: stockStatuses[row.stockStatus],
        stockQuantity: row.stockQuantity,
        featured: row.featured,
        active: row.active,
        images: row.images.map((image) => image.url),
        seo: { title: row.seoTitle, description: row.seoDescription },
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };

    switch (productKinds[row.kind]) {
        case "wine-cellar":
            // The database guarantees the cellar fields for WINE_CELLAR rows.
            return {
                ...base,
                kind: "wine-cellar",
                capacity: row.capacity!,
                zones: row.zones as TemperatureZoneCount,
                temperatureRanges: row.temperatureZones.map((zone) => ({ min: zone.minCelsius, max: zone.maxCelsius })),
                installationType: installationTypes[row.installationType!],
                dimensions: dimensionsOf(row)!,
                reversibleDoor: optional(row.reversibleDoor),
                uvProtectedGlass: optional(row.uvProtectedGlass),
                ledLighting: optional(row.ledLighting),
                lock: optional(row.lock),
            };
        case "climate-unit":
            return { ...base, kind: "climate-unit", roomVolume: row.roomVolumeM3!, coolingPower: optional(row.coolingPowerW), dimensions: dimensionsOf(row) };
        case "wine-rack":
            return { ...base, kind: "wine-rack", capacity: row.capacity!, material: optional(row.material), dimensions: dimensionsOf(row) };
        case "accessory":
            return { ...base, kind: "accessory", dimensions: dimensionsOf(row) };
    }
}

const kindToDb = Object.fromEntries(Object.entries(productKinds).map(([db, domain]) => [domain, db])) as Record<DomainProductKind, ProductKind>;

const isCellar = (product: Product): product is WineCellarProduct => product.kind === "wine-cellar";

async function findProducts(
    where: Prisma.ProductWhereInput,
    options: {
        orderBy?: Prisma.ProductOrderByWithRelationInput[];
        take?: number;
    } = {},
) {
    "use cache";
    cacheCatalogData();

    const rows = await db.product.findMany({
        where: { AND: [{ active: true }, where] },
        include: productInclude,
        orderBy: options.orderBy ?? defaultProductOrder,
        take: options.take,
    });

    return rows.map(toDomainProduct);
}

/** Every active product, of every kind (sitemap, search). */
export async function getActiveProducts(): Promise<Product[]> {
    return findProducts({});
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
    return findProducts({ featured: true }, { take: limit });
}

export async function getProductsByBrand(
    brandSlug: string,
): Promise<Product[]> {
    return findProducts({ brand: { slug: brandSlug } });
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
    return findProducts({ categories: { some: { category: { slug: categorySlug } } } });
}

/** Active products per category slug. */
export async function getProductCountByCategory(): Promise<Map<string, number>> {
    "use cache";
    cacheCatalogData();

    const categories = await db.category.findMany({
        select: { slug: true, _count: { select: { products: { where: { product: { active: true } } } } } },
    });

    return new Map(categories.map((category) => [category.slug, category._count.products]));
}

export async function getProductCountByBrand(): Promise<Map<string, number>> {
    "use cache";
    cacheCatalogData();

    const brands = await db.brand.findMany({
        select: {
            slug: true,
            _count: { select: { products: { where: { active: true } } } },
        },
    });

    return new Map(brands.map((brand) => [brand.slug, brand._count.products]));
}

export async function getCatalogProducts(
    query: CatalogQuery,
): Promise<WineCellarProduct[]> {
    const products = await findProducts(buildCatalogWhere(query), {
        orderBy: buildCatalogOrderBy(query.sort),
    });

    return products.filter(isCellar);
}

/** Energy classes present in the active catalogue, best first. */
export async function getAvailableEnergyClasses(): Promise<string[]> {
    "use cache";
    cacheCatalogData();

    const rows = await db.product.findMany({
        where: { active: true, kind: ProductKind.WINE_CELLAR, energyClass: { not: null } },
        select: { energyClass: true },
        distinct: ["energyClass"],
        orderBy: { energyClass: "asc" },
    });

    return rows.flatMap((row) => (row.energyClass ? [row.energyClass] : []));
}

/**
 * Wrapped in React `cache` so generateMetadata and the page share one query
 * per request.
 */
export const getProductBySlug = cache(
    async (slug: string): Promise<WineCellarProduct | null> => {
        const [product] = await findProducts({ slug, kind: ProductKind.WINE_CELLAR }, { take: 1 });

        return product && isCellar(product) ? product : null;
    },
);

/**
 * Related products: same brand or a comparable capacity (±50%), closest
 * capacity first. Simple, explainable rules until real recommendation data
 * exists.
 */
export async function getRelatedProducts(
    product: WineCellarProduct,
    limit = 3,
): Promise<WineCellarProduct[]> {
    const candidates = (await findProducts(
        {
            id: { not: product.id },
            kind: ProductKind.WINE_CELLAR,
            OR: [
                { brand: { slug: product.brandSlug } },
                {
                    capacity: {
                        gte: Math.floor(product.capacity * 0.5),
                        lte: Math.ceil(product.capacity * 1.5),
                    },
                },
            ],
        },
        { take: 24 },
    )).filter(isCellar);

    return candidates
        .sort(
            (a, b) =>
                Math.abs(a.capacity - product.capacity) -
                Math.abs(b.capacity - product.capacity),
        )
        .slice(0, limit);
}

export async function getProductById(id: string): Promise<Product | null> {
    const [product] = await findProducts({ id }, { take: 1 });

    return product ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) {
        return [];
    }

    return findProducts({ id: { in: ids } });
}

/** Active products of one kind (the /climatizadores, /garrafeiras and /acessorios listings). */
export async function getProductsByKind(kind: DomainProductKind, sort: SortValue = DEFAULT_SORT): Promise<Product[]> {
    return findProducts({ kind: kindToDb[kind] }, { orderBy: buildCatalogOrderBy(sort) });
}

/** A product page outside /caves: the slug must belong to that kind. */
export const getProductBySlugAndKind = cache(async (kind: DomainProductKind, slug: string): Promise<Product | null> => {
    const [product] = await findProducts({ slug, kind: kindToDb[kind] }, { take: 1 });

    return product ?? null;
});
