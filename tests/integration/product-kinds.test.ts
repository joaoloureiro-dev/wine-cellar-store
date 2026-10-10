import { beforeEach, describe, expect, it } from "vitest";

import { createCategory } from "@/lib/admin/categories";
import { categorySchema } from "@/lib/admin/category-schema";
import { productCreateSchema, productDetailsSchema } from "@/lib/admin/product-details-schema";
import { createProduct as adminCreateProduct, updateProductDetails } from "@/lib/admin/products";
import { db } from "@/lib/db";
import { getActiveProducts, getCatalogProducts, getProductBySlug, getProductBySlugAndKind, getProductsByKind } from "@/lib/products";
import { DEFAULT_SORT } from "@/lib/catalog/options";
import { createProduct, resetDatabase } from "../support/db";

let admin: { id: string; name: string; email: string };
let brandId: string;

beforeEach(async () => {
    await resetDatabase();
    admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });
    ({ brandId } = await createProduct({ stock: 1 }));
});

const climateForm = (changes: Record<string, string> = {}) => ({
    kind: "CLIMATE_UNIT",
    name: "Wine Room 25",
    brandId,
    sku: "CLIMA-25",
    shortDescription: "Climatizador para adegas até 25 m³.",
    description: "Mantém a temperatura e a humidade certas numa adega fechada.",
    roomVolumeM3: "25",
    coolingPowerW: "950",
    price: "1890",
    stockQuantity: "3",
    ...changes,
});

const fieldErrors = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
    result.success ? [] : result.error!.issues.map((issue) => issue.path.join("."));

describe("product kinds", () => {
    it("requires each kind's own fields and stores nothing a kind does not have", async () => {
        expect(fieldErrors(productCreateSchema.safeParse(climateForm({ roomVolumeM3: "" })))).toContain("roomVolumeM3");
        expect(fieldErrors(productCreateSchema.safeParse({ ...climateForm(), kind: "WINE_RACK" }))).toContain("capacity");
        // Dimensions: all three or none outside cellars.
        expect(fieldErrors(productCreateSchema.safeParse(climateForm({ widthCm: "40" })))).toEqual(expect.arrayContaining(["heightCm", "depthCm"]));

        // Cellar-only fields sent with a climate unit are dropped.
        const input = productCreateSchema.parse(climateForm({ capacity: "24", zones: "2", installationType: "BUILT_IN", material: "Pinho" }));
        const created = await adminCreateProduct(admin, input);

        expect(await db.product.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({
            kind: "CLIMATE_UNIT",
            roomVolumeM3: 25,
            coolingPowerW: 950,
            capacity: null,
            zones: null,
            installationType: null,
            material: null,
            widthMm: null,
            seoTitle: "Wine Room 25 | Climatizador de Adega até 25 m³",
        });
        expect(await db.productTemperatureZone.count({ where: { productId: created.id } })).toBe(0);
    });

    it("keeps the kind on edit, whatever the form sends", async () => {
        const created = await adminCreateProduct(admin, productCreateSchema.parse(climateForm()));
        const { updatedAt } = await db.product.findUniqueOrThrow({ where: { id: created.id } });

        // The edit action parses with the stored kind (lib/admin/product-detail-actions.ts).
        const edit = productDetailsSchema.parse({ ...climateForm({ roomVolumeM3: "40" }), kind: "CLIMATE_UNIT", productId: created.id, version: String(updatedAt.getTime()) });
        expect("kind" in edit.data).toBe(false);
        await updateProductDetails(admin, edit);

        expect(await db.product.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ kind: "CLIMATE_UNIT", roomVolumeM3: 40 });
    });

    it("the database refuses a product without its kind's required fields", async () => {
        const base = { brandId, shortDescription: "x", description: "x", priceCents: 100, seoTitle: "x", seoDescription: "x" };

        await expect(db.product.create({ data: { ...base, slug: "cave-sem-dados", sku: "C-1", name: "Cave" } })).rejects.toThrow(/Product_kind_required_fields/);
        await expect(db.product.create({ data: { ...base, kind: "CLIMATE_UNIT", slug: "clima-sem-volume", sku: "C-2", name: "Clima" } })).rejects.toThrow(/Product_kind_required_fields/);
        await expect(db.product.create({ data: { ...base, kind: "WINE_RACK", slug: "estante", sku: "C-3", name: "Estante" } })).rejects.toThrow(/Product_kind_required_fields/);
        await expect(db.product.create({ data: { ...base, kind: "ACCESSORY", slug: "filtro", sku: "C-4", name: "Filtro" } })).resolves.toBeTruthy();
    });

    it("links only categories of the product's kind", async () => {
        const cellars = await createCategory(admin, categorySchema.parse({ name: "Caves compactas", description: "Caves pequenas." }));
        const climate = await createCategory(admin, categorySchema.parse({ name: "Climatização", description: "Climatizadores.", kind: "CLIMATE_UNIT" }));

        const created = await adminCreateProduct(admin, productCreateSchema.parse(climateForm({ categoryIds: `${cellars.id},${climate.id}` })));

        const linked = await db.productCategory.findMany({ where: { productId: created.id }, select: { categoryId: true } });
        expect(linked).toEqual([{ categoryId: climate.id }]);
    });

    it("keeps each kind on its own pages and the cellar catalogue", async () => {
        const created = await adminCreateProduct(admin, productCreateSchema.parse(climateForm()));
        await db.product.update({ where: { id: created.id }, data: { active: true } });
        const query = { brands: [], categories: [], capacity: [], zones: [], installation: [], inStock: false, energyClasses: [], sort: DEFAULT_SORT };

        expect((await getProductsByKind("climate-unit")).map((product) => product.slug)).toEqual([created.slug]);
        expect(await getProductsByKind("wine-rack")).toEqual([]);
        expect(await getProductBySlugAndKind("climate-unit", created.slug)).toMatchObject({ kind: "climate-unit", roomVolume: 25, coolingPower: 950 });
        expect(await getProductBySlugAndKind("accessory", created.slug)).toBeNull();
        expect(await getProductBySlug(created.slug)).toBeNull();
        expect((await getCatalogProducts(query)).every((product) => product.kind === "wine-cellar")).toBe(true);
        expect((await getActiveProducts()).map((product) => product.kind).sort()).toEqual(["climate-unit", "wine-cellar"]);
    });
});
