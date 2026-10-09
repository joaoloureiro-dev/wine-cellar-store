import { z } from "zod";

import {
    capacitySegments,
    catalogParams,
    DEFAULT_SORT,
    IN_STOCK_VALUE,
    installationOptions,
    sortOptions,
    zoneOptions,
    type CapacitySegmentValue,
    type InstallationValue,
    type SortValue,
} from "@/lib/catalog/options";
import type { TemperatureZoneCount } from "@/types/product";

export type CatalogQuery = {
    brands: string[];
    categories: string[];
    minPrice?: number;
    maxPrice?: number;
    capacity: CapacitySegmentValue[];
    zones: TemperatureZoneCount[];
    installation: InstallationValue[];
    inStock: boolean;
    energyClasses: string[];
    maxNoise?: number;
    maxWidth?: number;
    minTemperature?: number;
    sort: SortValue;
};

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const MAX_PRICE = 100_000;
const MAX_VALUES_PER_PARAM = 20;

/**
 * Search params are untrusted input. Every field is validated and invalid
 * values are dropped (never thrown), so a malformed or tampered URL degrades
 * to a broader result set instead of an error page.
 */

function toArray(value: unknown): unknown[] {
    if (value === undefined) {
        return [];
    }

    return (Array.isArray(value) ? value : [value]).slice(0, MAX_VALUES_PER_PARAM);
}

/** Keeps only allowed values (matched as strings), deduplicated. */
function oneOf<const T extends string | number>(allowed: readonly T[]) {
    return z.preprocess(toArray, z.array(z.unknown())).transform((values) => {
        const result: T[] = [];

        for (const value of values) {
            const match = allowed.find((option) => String(option) === String(value));

            if (match !== undefined && !result.includes(match)) {
                result.push(match);
            }
        }

        return result;
    });
}

const optionalNumber = (max: number) =>
    z.preprocess(
        (value) => (Array.isArray(value) ? value[0] : value) || undefined,
        z.coerce.number().int().min(0).max(max).optional(),
    ).catch(undefined);

const energyClassSchema = z
    .preprocess(
        (value) =>
            toArray(value)
                .filter((item): item is string => typeof item === "string")
                .map((item) => item.trim().toUpperCase()),
        z.array(z.string()),
    )
    .transform((values) => [
        ...new Set(values.filter((value) => /^[A-G]$/.test(value))),
    ]);

function createCatalogQuerySchema(brandSlugs: readonly string[], categorySlugs: readonly string[]) {
    return z.object({
        [catalogParams.brand]: oneOf(brandSlugs).catch([]),
        [catalogParams.category]: oneOf(categorySlugs).catch([]),
        [catalogParams.minPrice]: optionalNumber(MAX_PRICE),
        [catalogParams.maxPrice]: optionalNumber(MAX_PRICE),
        [catalogParams.capacity]: oneOf(
            capacitySegments.map((segment) => segment.value),
        ).catch([]),
        [catalogParams.zones]: oneOf(zoneOptions).catch([]),
        [catalogParams.installation]: oneOf(
            installationOptions.map((option) => option.value),
        ).catch([]),
        [catalogParams.availability]: oneOf([IN_STOCK_VALUE]).catch([]),
        [catalogParams.energyClass]: energyClassSchema.catch([]),
        [catalogParams.maxNoise]: optionalNumber(100),
        [catalogParams.maxWidth]: optionalNumber(300),
        [catalogParams.minTemperature]: z.preprocess(
            (value) => (Array.isArray(value) ? value[0] : value) || undefined,
            z.coerce.number().int().min(-10).max(30).optional(),
        ).catch(undefined),
        [catalogParams.sort]: z
            .preprocess(
                (value) => (Array.isArray(value) ? value[0] : value),
                z.enum(sortOptions.map((option) => option.value)),
            )
            .catch(DEFAULT_SORT),
    });
}

export function parseCatalogQuery(
    searchParams: CatalogSearchParams,
    { brandSlugs, categorySlugs = [] }: { brandSlugs: readonly string[]; categorySlugs?: readonly string[] },
): CatalogQuery {
    const parsed = createCatalogQuerySchema(brandSlugs, categorySlugs).parse(searchParams);

    let minPrice = parsed[catalogParams.minPrice];
    let maxPrice = parsed[catalogParams.maxPrice];

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    return {
        brands: parsed[catalogParams.brand],
        categories: parsed[catalogParams.category],
        minPrice,
        maxPrice,
        capacity: parsed[catalogParams.capacity],
        zones: parsed[catalogParams.zones],
        installation: parsed[catalogParams.installation],
        inStock: parsed[catalogParams.availability].length > 0,
        energyClasses: parsed[catalogParams.energyClass],
        maxNoise: parsed[catalogParams.maxNoise],
        maxWidth: parsed[catalogParams.maxWidth],
        minTemperature: parsed[catalogParams.minTemperature],
        sort: parsed[catalogParams.sort],
    };
}

export function toCatalogSearchParams(query: CatalogQuery) {
    const params = new URLSearchParams();

    query.brands.forEach((brand) => params.append(catalogParams.brand, brand));
    query.categories.forEach((category) => params.append(catalogParams.category, category));

    if (query.minPrice !== undefined) {
        params.set(catalogParams.minPrice, String(query.minPrice));
    }

    if (query.maxPrice !== undefined) {
        params.set(catalogParams.maxPrice, String(query.maxPrice));
    }

    query.capacity.forEach((value) => params.append(catalogParams.capacity, value));
    query.zones.forEach((value) => params.append(catalogParams.zones, String(value)));
    query.installation.forEach((value) =>
        params.append(catalogParams.installation, value),
    );

    if (query.inStock) {
        params.set(catalogParams.availability, IN_STOCK_VALUE);
    }

    query.energyClasses.forEach((value) =>
        params.append(catalogParams.energyClass, value),
    );

    if (query.maxNoise !== undefined) {
        params.set(catalogParams.maxNoise, String(query.maxNoise));
    }

    if (query.maxWidth !== undefined) {
        params.set(catalogParams.maxWidth, String(query.maxWidth));
    }

    if (query.minTemperature !== undefined) {
        params.set(catalogParams.minTemperature, String(query.minTemperature));
    }

    if (query.sort !== DEFAULT_SORT) {
        params.set(catalogParams.sort, query.sort);
    }

    return params;
}

/** Removes every filter but keeps the current sort order. */
export function clearCatalogFilters(query: CatalogQuery): CatalogQuery {
    return {
        brands: [],
        categories: [],
        capacity: [],
        zones: [],
        installation: [],
        inStock: false,
        energyClasses: [],
        sort: query.sort,
    };
}

export function getCatalogHref(query: CatalogQuery, pathname = "/caves") {
    const search = toCatalogSearchParams(query).toString();

    return search ? `${pathname}?${search}` : pathname;
}

export function countActiveFilters(query: CatalogQuery) {
    return (
        query.brands.length +
        query.categories.length +
        (query.minPrice !== undefined || query.maxPrice !== undefined ? 1 : 0) +
        query.capacity.length +
        query.zones.length +
        query.installation.length +
        (query.inStock ? 1 : 0) +
        query.energyClasses.length +
        (query.maxNoise !== undefined ? 1 : 0) +
        (query.maxWidth !== undefined ? 1 : 0) +
        (query.minTemperature !== undefined ? 1 : 0)
    );
}
