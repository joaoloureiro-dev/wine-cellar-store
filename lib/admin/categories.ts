import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Admin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import type { CategoryInput } from "@/lib/admin/category-schema";
import { db } from "@/lib/db";

export async function listAdminCategories() {
    return db.category.findMany({
        orderBy: [{ position: "asc" }, { name: "asc" }],
        select: { id: true, slug: true, name: true, position: true, _count: { select: { products: true } } },
    });
}

export async function getAdminCategory(id: string) {
    if (!/^[a-z0-9-]{1,64}$/i.test(id)) return null;

    return db.category.findUnique({
        where: { id },
        select: { id: true, slug: true, name: true, description: true, position: true, seoTitle: true, seoDescription: true },
    });
}

/** Options for the product form. */
export async function getCategoryOptions() {
    return db.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } });
}

export async function createCategory(admin: Admin, input: CategoryInput) {
    return db.$transaction(async (tx) => {
        const category = await tx.category.create({ data: input, select: { id: true } });
        await recordAudit(tx, admin, { action: "category.create", entityType: "category", entityId: category.id, data: { slug: input.slug } });
        return category;
    });
}

/** The slug is fixed after creation: changing it would break published URLs. */
export async function updateCategory(admin: Admin, id: string, input: Omit<CategoryInput, "slug">) {
    return db.$transaction(async (tx) => {
        const { count } = await tx.category.updateMany({
            where: { id },
            data: { name: input.name, description: input.description, position: input.position, seoTitle: input.seoTitle, seoDescription: input.seoDescription },
        });

        if (count === 0) return false;

        await recordAudit(tx, admin, { action: "category.update", entityType: "category", entityId: id });
        return true;
    });
}

/** Removes the category; its products stay, without it. */
export async function deleteCategory(admin: Admin, id: string) {
    return db.$transaction(async (tx) => {
        const category = await tx.category.findUnique({ where: { id }, select: { slug: true, _count: { select: { products: true } } } });
        if (!category) return false;

        await tx.category.delete({ where: { id } });
        await recordAudit(tx, admin, {
            action: "category.delete",
            entityType: "category",
            entityId: id,
            data: { slug: category.slug, products: category._count.products },
        });
        return true;
    });
}

/**
 * Sets a product's categories (inside the caller's transaction). Unknown
 * ids are ignored, so a category deleted while the form was open is simply
 * not assigned.
 */
export async function setProductCategories(tx: Prisma.TransactionClient, productId: string, categoryIds: string[]) {
    const existing = await tx.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });

    await tx.productCategory.deleteMany({ where: { productId } });
    await tx.productCategory.createMany({ data: existing.map(({ id }) => ({ productId, categoryId: id })) });
}
