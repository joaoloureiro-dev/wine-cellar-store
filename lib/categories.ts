import "server-only";

import { cacheCategoryData } from "@/lib/catalog/cache";
import { db } from "@/lib/db";

export type Category = {
    slug: string;
    name: string;
    description: string;
    seoTitle: string | null;
    seoDescription: string | null;
};

const categorySelect = { slug: true, name: true, description: true, seoTitle: true, seoDescription: true } as const;

/** All categories, in display order. */
export async function getCategories(): Promise<Category[]> {
    "use cache";
    cacheCategoryData();

    return db.category.findMany({ select: categorySelect, orderBy: [{ position: "asc" }, { name: "asc" }] });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
    "use cache";
    cacheCategoryData();

    return db.category.findUnique({ where: { slug }, select: categorySelect });
}
