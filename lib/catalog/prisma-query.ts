import {
    InstallationType,
    StockStatus,
    type Prisma,
} from "@/generated/prisma/client";
import {
    capacitySegments,
    installationOptions,
    type SortValue,
} from "@/lib/catalog/options";
import type { CatalogQuery } from "@/lib/catalog/query";

/**
 * Translates a validated CatalogQuery into Prisma filters.
 *
 * Values inside one filter are OR-ed, different filters are AND-ed. Every
 * condition maps onto an indexed column where it matters (price, capacity,
 * brand, active).
 */

const installationTypes = {
    freestanding: InstallationType.FREESTANDING,
    "built-in": InstallationType.BUILT_IN,
    undercounter: InstallationType.UNDERCOUNTER,
} as const;

export function buildCatalogWhere(query: CatalogQuery): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [{ active: true }];

    if (query.brands.length > 0) {
        and.push({ brand: { slug: { in: query.brands } } });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        and.push({
            priceCents: {
                gte: query.minPrice === undefined ? undefined : query.minPrice * 100,
                lte: query.maxPrice === undefined ? undefined : query.maxPrice * 100,
            },
        });
    }

    if (query.capacity.length > 0) {
        and.push({
            OR: capacitySegments
                .filter((segment) => query.capacity.includes(segment.value))
                .map((segment) => ({
                    capacity: {
                        gte: segment.min,
                        lte: Number.isFinite(segment.max) ? segment.max : undefined,
                    },
                })),
        });
    }

    if (query.zones.length > 0) {
        and.push({ zones: { in: query.zones } });
    }

    if (query.installation.length > 0) {
        and.push({
            installationType: {
                in: installationOptions
                    .filter((option) => query.installation.includes(option.value))
                    .map((option) => installationTypes[option.type]),
            },
        });
    }

    if (query.inStock) {
        and.push({ stockStatus: { in: [StockStatus.IN_STOCK, StockStatus.LOW_STOCK] } });
    }

    if (query.energyClasses.length > 0) {
        and.push({ energyClass: { in: query.energyClasses } });
    }

    if (query.maxNoise !== undefined) {
        and.push({ noiseDb: { lte: query.maxNoise } });
    }

    if (query.maxWidth !== undefined) {
        and.push({ widthMm: { lte: query.maxWidth * 10 } });
    }

    if (query.minTemperature !== undefined) {
        // "Can reach X °C": the coldest zone's minimum is at or below X.
        and.push({
            temperatureZones: { some: { minCelsius: { lte: query.minTemperature } } },
        });
    }

    return { AND: and };
}

/** Relevance: featured first, then smallest capacity. */
export const defaultProductOrder: Prisma.ProductOrderByWithRelationInput[] = [
    { featured: "desc" },
    { capacity: "asc" },
    { name: "asc" },
];

const sortOrders: Record<SortValue, Prisma.ProductOrderByWithRelationInput[]> = {
    relevancia: defaultProductOrder,
    "preco-asc": [{ priceCents: "asc" }, ...defaultProductOrder],
    "preco-desc": [{ priceCents: "desc" }, ...defaultProductOrder],
    "capacidade-asc": [{ capacity: "asc" }, ...defaultProductOrder],
    "capacidade-desc": [{ capacity: "desc" }, ...defaultProductOrder],
    novidades: [{ createdAt: "desc" }, ...defaultProductOrder],
};

export function buildCatalogOrderBy(sort: SortValue) {
    return sortOrders[sort];
}
