import { products } from "@/data/products";
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
