import { beforeEach, describe, expect, it } from "vitest";

import { adminTransitionReservation } from "@/lib/admin/reservation-operations";
import { ProductConflictError, updateProduct } from "@/lib/admin/products";
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
