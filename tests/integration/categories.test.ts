import { beforeEach, describe, expect, it } from "vitest";

import { createCategory, deleteCategory, updateCategory } from "@/lib/admin/categories";
import { categorySchema } from "@/lib/admin/category-schema";
import { productCreateSchema, productDetailsSchema } from "@/lib/admin/product-details-schema";
import { createProduct as adminCreateProduct, updateProductDetails } from "@/lib/admin/products";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { db } from "@/lib/db";
import { createProduct, resetDatabase } from "../support/db";

let admin: { id: string; name: string; email: string };

beforeEach(async () => {
    await resetDatabase();
    admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });
});

const category = (name: string, extra: Record<string, string> = {}) =>
    createCategory(admin, categorySchema.parse({ name, description: `Caves para ${name.toLowerCase()}.`, ...extra }));

const productForm = (brandId: string, categoryIds: string[], changes: Record<string, string> = {}) => ({
    name: "Vinocave Duo 60",
    brandId,
    sku: "VC-DUO-60",
    shortDescription: "Cave de duas zonas para 60 garrafas.",
    description: "Cave de vinho de duas zonas, silenciosa, com prateleiras de madeira.",
    capacity: "60",
    zones: "1",
    installationType: "FREESTANDING",
    zone1Min: "5",
    zone1Max: "18",
    widthCm: "59,5",
    heightCm: "177",
    depthCm: "56",
    price: "1299",
    stockQuantity: "4",
    categoryIds: categoryIds.join(","),
    ...changes,
});

const categoriesOf = async (productId: string) =>
    (await db.productCategory.findMany({ where: { productId }, select: { category: { select: { slug: true } } }, orderBy: { category: { slug: "asc" } } })).map(
        (entry) => entry.category.slug,
    );

describe("categories", () => {
    it("derives the slug, keeps it on update and refuses duplicates", async () => {
        const created = await category("Caves de serviço", { position: "2" });

        expect(await db.category.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ slug: "caves-de-servico", position: 2, seoTitle: null });

        await updateCategory(admin, created.id, { ...categorySchema.parse({ name: "Caves para servir", description: "Prontas a servir à mesa." }) });
        expect(await db.category.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ slug: "caves-de-servico", name: "Caves para servir" });

        const duplicate = await category("Caves para servir").catch((error) => error);
        expect(uniqueViolationField(duplicate)).toBe("name");
    });

    it("assigns products to several categories and replaces them on edit", async () => {
        const service = await category("Serviço");
        const design = await category("Design");
        const ageing = await category("Envelhecimento");
        const { brandId } = await createProduct({ stock: 1 });

        const created = await adminCreateProduct(admin, productCreateSchema.parse(productForm(brandId, [service.id, design.id, "unknown-category"])));
        expect(await categoriesOf(created.id)).toEqual(["design", "servico"]);

        const { updatedAt } = await db.product.findUniqueOrThrow({ where: { id: created.id } });
        const edit = productDetailsSchema.parse({ ...productForm(brandId, [ageing.id]), productId: created.id, version: String(updatedAt.getTime()) });
        await updateProductDetails(admin, edit);
        expect(await categoriesOf(created.id)).toEqual(["envelhecimento"]);

        const cleared = productDetailsSchema.parse({ ...productForm(brandId, []), productId: created.id, version: String((await db.product.findUniqueOrThrow({ where: { id: created.id } })).updatedAt.getTime()) });
        await updateProductDetails(admin, cleared);
        expect(await categoriesOf(created.id)).toEqual([]);
    });

    it("deleting a category keeps its products", async () => {
        const service = await category("Serviço");
        const { brandId } = await createProduct({ stock: 1 });
        const created = await adminCreateProduct(admin, productCreateSchema.parse(productForm(brandId, [service.id])));

        expect(await deleteCategory(admin, service.id)).toBe(true);

        expect(await db.product.count({ where: { id: created.id } })).toBe(1);
        expect(await categoriesOf(created.id)).toEqual([]);
        expect(await db.adminAuditLog.findFirst({ where: { action: "category.delete" }, select: { data: true } })).toMatchObject({ data: { slug: "servico", products: 1 } });
    });
});
