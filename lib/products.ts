import "server-only";

import { cache } from "react";

import {
    InstallationType,
    StockStatus,
    type Prisma,
} from "@/generated/prisma/client";
import {
    buildCatalogOrderBy,
    buildCatalogWhere,
    defaultProductOrder,
} from "@/lib/catalog/prisma-query";
import type { CatalogQuery } from "@/lib/catalog/query";
import { cacheCatalogData } from "@/lib/catalog/cache";
import { db } from "@/lib/db";
import type {
    InstallationType as DomainInstallationType,
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

function toDomainProduct(row: ProductRow): WineCellarProduct {
    return {
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
        compareAtPrice:
            row.compareAtPriceCents === null ? undefined : row.compareAtPriceCents / 100,
        capacity: row.capacity,
        zones: row.zones as TemperatureZoneCount,
        temperatureRanges: row.temperatureZones.map((zone) => ({
            min: zone.minCelsius,
            max: zone.maxCelsius,
        })),
        installationType: installationTypes[row.installationType],
        dimensions: {
            width: row.widthMm / 10,
            height: row.heightMm / 10,
            depth: row.depthMm / 10,
        },
        weight: row.weightGrams === null ? undefined : row.weightGrams / 1000,
        energyClass: optional(row.energyClass),
        annualEnergyConsumption: optional(row.annualEnergyKwh),
        noiseLevel: optional(row.noiseDb),
        reversibleDoor: optional(row.reversibleDoor),
        uvProtectedGlass: optional(row.uvProtectedGlass),
        ledLighting: optional(row.ledLighting),
        lock: optional(row.lock),
        stockStatus: stockStatuses[row.stockStatus],
        stockQuantity: row.stockQuantity,
        featured: row.featured,
        active: row.active,
        images: row.images.map((image) => image.url),
        seo: {
            title: row.seoTitle,
            description: row.seoDescription,
        },
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

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

export async function getActiveProducts(): Promise<WineCellarProduct[]> {
    return findProducts({});
}

export async function getFeaturedProducts(limit = 4): Promise<WineCellarProduct[]> {
    return findProducts({ featured: true }, { take: limit });
}

export async function getProductsByBrand(
    brandSlug: string,
): Promise<WineCellarProduct[]> {
    return findProducts({ brand: { slug: brandSlug } });
}

export async function getProductsByCategory(categorySlug: string): Promise<WineCellarProduct[]> {
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
    return findProducts(buildCatalogWhere(query), {
        orderBy: buildCatalogOrderBy(query.sort),
    });
}

/** Energy classes present in the active catalogue, best first. */
export async function getAvailableEnergyClasses(): Promise<string[]> {
    "use cache";
    cacheCatalogData();

    const rows = await db.product.findMany({
        where: { active: true, energyClass: { not: null } },
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
        const [product] = await findProducts({ slug }, { take: 1 });

        return product ?? null;
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
    const candidates = await findProducts(
        {
            id: { not: product.id },
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
    );

    return candidates
        .sort(
            (a, b) =>
                Math.abs(a.capacity - product.capacity) -
                Math.abs(b.capacity - product.capacity),
        )
        .slice(0, limit);
}

export async function getProductById(id: string): Promise<WineCellarProduct | null> {
    const [product] = await findProducts({ id }, { take: 1 });

    return product ?? null;
}

export async function getProductsByIds(ids: string[]): Promise<WineCellarProduct[]> {
    if (ids.length === 0) {
        return [];
    }

    return findProducts({ id: { in: ids } });
}
