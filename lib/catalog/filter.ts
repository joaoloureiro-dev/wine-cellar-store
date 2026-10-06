import {
    capacitySegments,
    installationOptions,
    type SortValue,
} from "@/lib/catalog/options";
import type { CatalogQuery } from "@/lib/catalog/query";
import { getBrandSlug } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

/**
 * Pure, in-memory implementation of catalogue filtering and sorting.
 *
 * It defines the expected semantics: values inside one filter are OR-ed,
 * different filters are AND-ed. When products move to PostgreSQL these rules
 * translate one-to-one into a Prisma `where` / `orderBy`.
 */

function getMinTemperature(product: WineCellarProduct) {
    if (product.temperatureRanges.length === 0) {
        return undefined;
    }

    return Math.min(...product.temperatureRanges.map((range) => range.min));
}

export function matchesCatalogQuery(
    product: WineCellarProduct,
    query: CatalogQuery,
) {
    if (query.brands.length > 0 && !query.brands.includes(getBrandSlug(product.brand))) {
        return false;
    }

    if (query.minPrice !== undefined && product.price < query.minPrice) {
        return false;
    }

    if (query.maxPrice !== undefined && product.price > query.maxPrice) {
        return false;
    }

    if (
        query.capacity.length > 0 &&
        !capacitySegments.some(
            (segment) =>
                query.capacity.includes(segment.value) &&
                product.capacity >= segment.min &&
                product.capacity <= segment.max,
        )
    ) {
        return false;
    }

    if (query.zones.length > 0 && !query.zones.includes(product.zones)) {
        return false;
    }

    if (
        query.installation.length > 0 &&
        !installationOptions.some(
            (option) =>
                query.installation.includes(option.value) &&
                option.type === product.installationType,
        )
    ) {
        return false;
    }

    if (
        query.inStock &&
        product.stockStatus !== "in_stock" &&
        product.stockStatus !== "low_stock"
    ) {
        return false;
    }

    if (
        query.energyClasses.length > 0 &&
        (!product.energyClass || !query.energyClasses.includes(product.energyClass))
    ) {
        return false;
    }

    if (
        query.maxNoise !== undefined &&
        (product.noiseLevel === undefined || product.noiseLevel > query.maxNoise)
    ) {
        return false;
    }

    if (query.maxWidth !== undefined && product.dimensions.width > query.maxWidth) {
        return false;
    }

    if (query.minTemperature !== undefined) {
        const minTemperature = getMinTemperature(product);

        if (minTemperature === undefined || minTemperature > query.minTemperature) {
            return false;
        }
    }

    return true;
}

const comparators: Record<
    Exclude<SortValue, "relevancia">,
    (a: WineCellarProduct, b: WineCellarProduct) => number
> = {
    "preco-asc": (a, b) => a.price - b.price,
    "preco-desc": (a, b) => b.price - a.price,
    "capacidade-asc": (a, b) => a.capacity - b.capacity,
    "capacidade-desc": (a, b) => b.capacity - a.capacity,
    novidades: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
};

/**
 * Expects products already in default (relevance) order; `Array#sort` is
 * stable, so ties keep that order.
 */
export function sortProducts(products: WineCellarProduct[], sort: SortValue) {
    if (sort === "relevancia") {
        return products;
    }

    return [...products].sort(comparators[sort]);
}

export function filterAndSortProducts(
    products: WineCellarProduct[],
    query: CatalogQuery,
) {
    return sortProducts(
        products.filter((product) => matchesCatalogQuery(product, query)),
        query.sort,
    );
}
