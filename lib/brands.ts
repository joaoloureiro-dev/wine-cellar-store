import "server-only";

import { cache } from "react";

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
    return db.brand.findMany({ select: brandSelect, orderBy: { name: "asc" } });
}

export const getBrandBySlug = cache(async (slug: string): Promise<Brand | null> => {
    return db.brand.findUnique({ where: { slug }, select: brandSelect });
});
