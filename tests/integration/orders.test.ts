import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { expireOverdueOrders } from "@/lib/orders/expiry";
import { OrderError, placeOrder, transitionOrderStatus } from "@/lib/orders/service";
import { checkoutInput, createProduct, resetDatabase, stockOf } from "../support/db";

beforeEach(resetDatabase);

describe("placeOrder", () => {
    it("holds stock, snapshots prices and computes totals in the database", async () => {
        const product = await createProduct({ stock: 5, priceCents: 49_900 });

        const { reference } = await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 2 }]);
        const order = await db.order.findUniqueOrThrow({ where: { reference }, include: { items: true, events: true } });

        expect(order).toMatchObject({ status: "AWAITING_PAYMENT", subtotalCents: 99_800, shippingCents: 4_900, totalCents: 104_700 });
        expect(order.items[0]).toMatchObject({ unitPriceCents: 49_900, quantity: 2, lineTotalCents: 99_800 });
        expect(order.events).toHaveLength(1);
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 3, stockStatus: "LOW_STOCK" });
    });

    it("sells the last unit exactly once under concurrent checkouts", async () => {
        const product = await createProduct({ stock: 1 });
        const attempts = Array.from({ length: 8 }, () =>
            placeOrder(checkoutInput(), [{ productId: product.id, quantity: 1 }]),
        );

        const results = await Promise.allSettled(attempts);
        const fulfilled = results.filter((result) => result.status === "fulfilled");
        const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

        expect(fulfilled).toHaveLength(1);
        expect(rejected.every((result) => result.reason instanceof OrderError && result.reason.code === "INSUFFICIENT_STOCK")).toBe(true);
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 0, stockStatus: "OUT_OF_STOCK" });
        expect(await db.order.count()).toBe(1);
    });

    it("never oversells multi-unit orders under concurrency", async () => {
        const product = await createProduct({ stock: 3 });
        const results = await Promise.allSettled(
            Array.from({ length: 4 }, () => placeOrder(checkoutInput(), [{ productId: product.id, quantity: 2 }])),
        );

        const rejected = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        // A clear "out of stock" for customers, not a database constraint error.
        expect(rejected.map((result) => (result.reason as OrderError).code)).toEqual([
            "INSUFFICIENT_STOCK",
            "INSUFFICIENT_STOCK",
            "INSUFFICIENT_STOCK",
        ]);
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 1, stockStatus: "LOW_STOCK" });
    });

    it("is idempotent: the same submission never creates a second order", async () => {
        const product = await createProduct({ stock: 5 });
        const input = checkoutInput();

        const [first, second] = await Promise.all([
            placeOrder(input, [{ productId: product.id, quantity: 1 }]),
            placeOrder(input, [{ productId: product.id, quantity: 1 }]),
        ]);

        expect(second.reference).toBe(first.reference);
        expect(await db.order.count()).toBe(1);
        expect((await stockOf(product.id)).stockQuantity).toBe(4);
    });

    it("rolls everything back when one line has no stock", async () => {
        const available = await createProduct({ stock: 5 });
        const soldOut = await createProduct({ stock: 0 });

        await expect(
            placeOrder(checkoutInput(), [
                { productId: available.id, quantity: 1 },
                { productId: soldOut.id, quantity: 1 },
            ]),
        ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });

        expect((await stockOf(available.id)).stockQuantity).toBe(5);
        expect(await db.order.count()).toBe(0);
    });
});

describe("order transitions", () => {
    it("releases stock on cancellation and refuses invalid or repeated transitions", async () => {
        const product = await createProduct({ stock: 2 });
        const { reference } = await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 2 }]);

        await expect(transitionOrderStatus({ reference, to: "SHIPPED", actor: "ADMIN" })).rejects.toMatchObject({
            code: "INVALID_TRANSITION",
        });

        await transitionOrderStatus({ reference, to: "CANCELLED", actor: "ADMIN", note: "teste" });
        expect(await stockOf(product.id)).toEqual({ stockQuantity: 2, stockStatus: "LOW_STOCK" });

        await expect(transitionOrderStatus({ reference, to: "CANCELLED", actor: "ADMIN" })).rejects.toBeInstanceOf(OrderError);
        expect((await stockOf(product.id)).stockQuantity).toBe(2);
    });

    it("expires overdue unpaid orders and gives their stock back", async () => {
        const product = await createProduct({ stock: 3 });
        const { reference } = await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 3 }]);
        await db.order.update({ where: { reference }, data: { paymentDueAt: new Date(Date.now() - 1000) } });

        expect(await expireOverdueOrders()).toEqual({ expired: 1, skipped: 0 });
        expect((await db.order.findUniqueOrThrow({ where: { reference } })).status).toBe("EXPIRED");
        expect((await stockOf(product.id)).stockQuantity).toBe(3);
        expect(await expireOverdueOrders()).toEqual({ expired: 0, skipped: 0 });
    });
});
