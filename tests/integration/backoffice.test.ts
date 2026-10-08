import { beforeEach, describe, expect, it } from "vitest";

import { adminTransitionReservation } from "@/lib/admin/reservation-operations";
import { productCreateSchema, productDetailsSchema } from "@/lib/admin/product-details-schema";
import { createProduct as adminCreateProduct, ProductConflictError, ProductWithoutImagesError, updateProduct, updateProductDetails } from "@/lib/admin/products";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { db } from "@/lib/db";
import { expireOverdueReservations } from "@/lib/reservations/expiry";
import { createProduct, resetDatabase, stockOf } from "../support/db";

let admin: { id: string; name: string; email: string };

beforeEach(async () => {
    await resetDatabase();
    admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });
});

async function createReservation(productId: string, quantity = 1) {
    return db.reservation.create({
        data: {
            reference: `RSV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            productId,
            quantity,
            unitPriceCents: 49_900,
            customerName: "Miguel Reis",
            customerEmail: "miguel@example.pt",
            customerPhone: "913222111",
            privacyConsentAt: new Date(),
        },
    });
}

describe("reservations", () => {
    it("holds stock on confirmation and releases it on cancellation", async () => {
        const product = await createProduct({ stock: 4 });
        const reservation = await createReservation(product.id, 2);

        const confirmed = await adminTransitionReservation(admin, { reference: reservation.reference, to: "CONFIRMED", holdDays: 5 });
        expect(confirmed).toMatchObject({ stockHeld: true, stockChanged: true });
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 2, stockStatus: "LOW_STOCK" });

        await adminTransitionReservation(admin, { reference: reservation.reference, to: "CANCELLED", note: "desistiu" });
        expect((await stockOf(product.id)).stockQuantity).toBe(4);
        expect((await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).stockHeld).toBe(false);
    });

    it("confirms out-of-stock items without a hold", async () => {
        const product = await createProduct({ stock: 0 });
        const reservation = await createReservation(product.id);

        const result = await adminTransitionReservation(admin, { reference: reservation.reference, to: "CONFIRMED", holdDays: 5 });

        expect(result).toMatchObject({ stockHeld: false, stockChanged: false });
        expect((await stockOf(product.id)).stockQuantity).toBe(0);
    });

    it("expires overdue confirmed reservations and releases held stock", async () => {
        const product = await createProduct({ stock: 3 });
        const reservation = await createReservation(product.id);
        await adminTransitionReservation(admin, { reference: reservation.reference, to: "CONFIRMED", holdDays: 1 });
        await db.reservation.update({ where: { id: reservation.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

        expect(await expireOverdueReservations()).toEqual({ expired: 1, skipped: 0 });
        expect((await stockOf(product.id)).stockQuantity).toBe(3);
    });
});

describe("updateProduct", () => {
    const input = (productId: string, version: number) => ({
        productId,
        version,
        price: 45_900,
        compareAtPrice: null,
        stockQuantity: 10,
        availability: "auto" as const,
        active: true,
        featured: false,
    });

    it("saves and audits the changed fields", async () => {
        const product = await createProduct({ stock: 2 });

        expect(await updateProduct(admin, input(product.id, product.updatedAt.getTime()))).toBe(true);
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 10, stockStatus: "IN_STOCK" });

        const audit = await db.adminAuditLog.findFirstOrThrow({ where: { entityId: product.id } });
        expect(Object.keys(audit.data as object).sort()).toEqual(["priceCents", "stockQuantity", "stockStatus"]);
    });

    it("refuses to overwrite a change made after the form was loaded", async () => {
        const product = await createProduct({ stock: 2 });
        const staleVersion = product.updatedAt.getTime();
        await new Promise((resolve) => setTimeout(resolve, 5));
        await db.product.update({ where: { id: product.id }, data: { stockQuantity: 1 } });

        await expect(updateProduct(admin, input(product.id, staleVersion))).rejects.toBeInstanceOf(ProductConflictError);
        expect((await stockOf(product.id)).stockQuantity).toBe(1);
    });
});

describe("catalogue editing", () => {
    const form = (brandId: string, changes: Record<string, string> = {}) => ({
        name: "Vinocave Duo 60",
        brandId,
        sku: "VC-DUO-60",
        shortDescription: "Cave de duas zonas para 60 garrafas.",
        description: "Cave de vinho de duas zonas, silenciosa, com prateleiras de madeira.",
        capacity: "60",
        zones: "2",
        installationType: "BUILT_IN",
        zone1Min: "5",
        zone1Max: "12",
        zone2Min: "14",
        zone2Max: "18",
        widthCm: "59,5",
        heightCm: "177",
        depthCm: "56",
        price: "1299",
        stockQuantity: "4",
        ...changes,
    });

    const zonesOf = (productId: string) =>
        db.productTemperatureZone.findMany({ where: { productId }, orderBy: { position: "asc" }, select: { position: true, minCelsius: true, maxCelsius: true } });

    it("creates a hidden product with its zones, then edits its details", async () => {
        const { brandId } = await createProduct({ stock: 1 });
        const created = await adminCreateProduct(admin, productCreateSchema.parse(form(brandId)));

        const product = await db.product.findUniqueOrThrow({ where: { id: created.id } });
        expect(product).toMatchObject({ slug: "vinocave-duo-60", active: false, priceCents: 129_900, widthMm: 595 });
        expect(await zonesOf(created.id)).toHaveLength(2);

        const edit = productDetailsSchema.parse({ ...form(brandId, { zones: "1", name: "Vinocave Solo 60" }), productId: created.id, version: String(product.updatedAt.getTime()) });
        expect(await updateProductDetails(admin, edit)).toBe(true);

        expect(await zonesOf(created.id)).toEqual([{ position: 1, minCelsius: 5, maxCelsius: 12 }]);
        expect((await db.product.findUniqueOrThrow({ where: { id: created.id } })).slug).toBe("vinocave-duo-60");

        const actions = await db.adminAuditLog.findMany({ where: { entityId: created.id }, orderBy: { createdAt: "asc" }, select: { action: true } });
        expect(actions.map((entry) => entry.action)).toEqual(["product.create", "product.details_update"]);
    });

    it("keeps the zones when the details were changed elsewhere", async () => {
        const { brandId } = await createProduct({ stock: 1 });
        const created = await adminCreateProduct(admin, productCreateSchema.parse(form(brandId)));
        const { updatedAt } = await db.product.findUniqueOrThrow({ where: { id: created.id } });
        await new Promise((resolve) => setTimeout(resolve, 5));
        await db.product.update({ where: { id: created.id }, data: { stockQuantity: 3 } });

        const edit = productDetailsSchema.parse({ ...form(brandId, { zones: "1" }), productId: created.id, version: String(updatedAt.getTime()) });

        await expect(updateProductDetails(admin, edit)).rejects.toBeInstanceOf(ProductConflictError);
        expect(await zonesOf(created.id)).toHaveLength(2);
    });

    it("publishes a new product only once it has a photo", async () => {
        const { brandId } = await createProduct({ stock: 1 });
        const created = await adminCreateProduct(admin, productCreateSchema.parse(form(brandId)));
        const publish = async () => {
            const { updatedAt } = await db.product.findUniqueOrThrow({ where: { id: created.id } });
            return updateProduct(admin, { productId: created.id, version: updatedAt.getTime(), price: 129_900, compareAtPrice: null, stockQuantity: 4, availability: "auto", active: true, featured: false });
        };

        await expect(publish()).rejects.toBeInstanceOf(ProductWithoutImagesError);
        await db.productImage.create({ data: { productId: created.id, url: "/images/products/test.webp", alt: "Cave", position: 0 } });
        expect(await publish()).toBe(true);
        expect((await db.product.findUniqueOrThrow({ where: { id: created.id } })).active).toBe(true);
    });

    it("reports which unique field clashed", async () => {
        const existing = await createProduct({ stock: 1 });
        const error = await adminCreateProduct(admin, productCreateSchema.parse(form(existing.brandId, { sku: existing.sku }))).catch((caught) => caught);

        expect(uniqueViolationField(error)).toBe("sku");
        expect(await db.product.count()).toBe(1);
    });
});
