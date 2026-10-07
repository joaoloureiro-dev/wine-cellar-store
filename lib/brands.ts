import "server-only";

import { cacheBrandData } from "@/lib/catalog/cache";
import { db } from "@/lib/db";
import type { Brand } from "@/types/brand";

/**
 * Brand data access layer (PostgreSQL via Prisma). Mirrors lib/products.ts:
 * components depend on these functions, never on the data source.
 */

const brandSelect = {
    slug: true,
    name: true,
    country: true,
    description: true,
} as const;

export async function getBrands(): Promise<Brand[]> {
    "use cache";
    cacheBrandData();

    return db.brand.findMany({ select: brandSelect, orderBy: { name: "asc" } });
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
    "use cache";
    cacheBrandData();

    return db.brand.findUnique({ where: { slug }, select: brandSelect });
}
