import { products } from "@/data/products";
import { filterAndSortProducts } from "@/lib/catalog/filter";
import type { CatalogQuery } from "@/lib/catalog/query";
import { getBrandSlug } from "@/lib/routes";
import type { WineCellarProduct } from "@/types/product";

/**
 * Product data access layer.
 *
 * UI components must read products through these functions only, so the
 * mock data source can later be swapped for PostgreSQL/Prisma without
 * changing any component. Functions are async to match that future contract.
 */

/**
 * Default catalogue order: featured products first, then by capacity.
 * User-selectable sorting is introduced with filters & sorting.
 */
function compareByDefaultOrder(a: WineCellarProduct, b: WineCellarProduct) {
    if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
    }

    return a.capacity - b.capacity;
}

export async function getActiveProducts(): Promise<WineCellarProduct[]> {
    return products
        .filter((product) => product.active)
        .sort(compareByDefaultOrder);
}

export async function getFeaturedProducts(
    limit = 4,
): Promise<WineCellarProduct[]> {
    const activeProducts = await getActiveProducts();

    return activeProducts
        .filter((product) => product.featured)
        .slice(0, limit);
}

export async function getProductsByBrand(
    brandSlug: string,
): Promise<WineCellarProduct[]> {
    const activeProducts = await getActiveProducts();

    return activeProducts.filter(
        (product) => getBrandSlug(product.brand) === brandSlug,
    );
}

export async function getProductCountByBrand(): Promise<Map<string, number>> {
    const activeProducts = await getActiveProducts();
    const counts = new Map<string, number>();

    for (const product of activeProducts) {
        const slug = getBrandSlug(product.brand);
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }

    return counts;
}

export async function getCatalogProducts(
    query: CatalogQuery,
): Promise<WineCellarProduct[]> {
    const activeProducts = await getActiveProducts();

    return filterAndSortProducts(activeProducts, query);
}

/** Energy classes present in the active catalogue, best first. */
export async function getAvailableEnergyClasses(): Promise<string[]> {
    const activeProducts = await getActiveProducts();
    const classes = new Set(
        activeProducts.flatMap((product) =>
            product.energyClass ? [product.energyClass] : [],
        ),
    );

    return [...classes].sort();
}

/** Slugs are unique across the catalogue (enforced by a DB unique index later). */
export async function getProductBySlug(
    slug: string,
): Promise<WineCellarProduct | null> {
    const activeProducts = await getActiveProducts();

    return activeProducts.find((product) => product.slug === slug) ?? null;
}

/**
 * Related products: same brand or a comparable capacity (±50%), closest
 * capacity first. Simple, explainable rules until real recommendation data
 * exists.
 */
export async function getRelatedProducts(
    product: WineCellarProduct,
    limit = 3,
): Promise<WineCellarProduct[]> {
    const activeProducts = await getActiveProducts();

    return activeProducts
        .filter((candidate) => candidate.id !== product.id)
        .filter(
            (candidate) =>
                candidate.brand === product.brand ||
                Math.abs(candidate.capacity - product.capacity) <=
                    product.capacity * 0.5,
        )
        .sort(
            (a, b) =>
                Math.abs(a.capacity - product.capacity) -
                Math.abs(b.capacity - product.capacity),
        )
        .slice(0, limit);
}
