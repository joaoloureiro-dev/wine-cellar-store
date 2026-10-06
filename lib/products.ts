import { products } from "@/data/products";
import type { WineCellarProduct } from "@/types/product";

/**
 * Product data access layer.
 *
 * UI components must read products through these functions only, so the
 * mock data source can later be swapped for PostgreSQL/Prisma without
 * changing any component. Functions are async to match that future contract.
 */

export async function getActiveProducts(): Promise<WineCellarProduct[]> {
    return products.filter((product) => product.active);
}

export async function getFeaturedProducts(
    limit = 4,
): Promise<WineCellarProduct[]> {
    const activeProducts = await getActiveProducts();

    return activeProducts
        .filter((product) => product.featured)
        .slice(0, limit);
}
