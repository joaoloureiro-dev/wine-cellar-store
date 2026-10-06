import { brands } from "@/data/brands";
import type { Brand } from "@/types/brand";

/**
 * Brand data access layer.
 *
 * Mirrors lib/products.ts: components depend on these async functions,
 * never on the underlying data source.
 */

export async function getBrands(): Promise<Brand[]> {
    return [...brands].sort((a, b) => a.name.localeCompare(b.name, "pt-PT"));
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
    return brands.find((brand) => brand.slug === slug) ?? null;
}
