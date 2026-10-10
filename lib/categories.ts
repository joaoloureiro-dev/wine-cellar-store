import "server-only";

import { cacheCategoryData } from "@/lib/catalog/cache";
import type { ProductKind } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type Category = {
    slug: string;
    name: string;
    description: string;
    seoTitle: string | null;
    seoDescription: string | null;
};

const categorySelect = { slug: true, name: true, description: true, seoTitle: true, seoDescription: true } as const;

/** Categories in display order; optionally only those of one product kind. */
export async function getCategories(kind?: ProductKind): Promise<Category[]> {
    "use cache";
    cacheCategoryData();

    return db.category.findMany({ where: kind ? { kind } : undefined, select: categorySelect, orderBy: [{ position: "asc" }, { name: "asc" }] });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    "use cache";
    cacheCategoryData();

    return db.category.findUnique({ where: { slug }, select: categorySelect });
}
