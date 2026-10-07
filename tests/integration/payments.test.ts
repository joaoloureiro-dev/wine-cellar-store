import { beforeEach, describe, expect, it } from "vitest";

import { confirmBankTransfer } from "@/lib/admin/order-operations";
import { db } from "@/lib/db";
import { placeOrder } from "@/lib/orders/service";
import { confirmPayment } from "@/lib/payments/service";
import { checkoutInput, createProduct, resetDatabase } from "../support/db";

beforeEach(resetDatabase);

async function orderWithPendingPayment(provider: "IFTHENPAY" | "MANUAL" = "IFTHENPAY") {
    const product = await createProduct({ stock: 5 });
    const { reference } = await placeOrder(
        checkoutInput({ paymentMethod: provider === "MANUAL" ? "BANK_TRANSFER" : "MBWAY" }),
        [{ productId: product.id, quantity: 1 }],
    );
    const order = await db.order.findUniqueOrThrow({ where: { reference } });
    const payment = await db.payment.create({
        data: {
            orderId: order.id,
            provider,
            method: provider === "MANUAL" ? "BANK_TRANSFER" : "MBWAY",
            amountCents: order.totalCents,
            providerReference: provider === "MANUAL" ? null : `req-${reference}`,
        },
    });

    return { order, payment };
}

const event = (orderReference: string, amountCents: number, externalId = `evt-${orderReference}`) => ({
    provider: "IFTHENPAY" as const,
    externalId,
    orderReference,
    providerReference: `req-${orderReference}`,
    amountCents,
    payload: { test: true },
});

describe("confirmPayment (webhooks)", () => {
    it("marks the payment and the order as paid", async () => {
        const { order } = await orderWithPendingPayment();

        expect(await confirmPayment(event(order.reference, order.totalCents))).toBe("paid");
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
    });

    it("ignores redeliveries of the same event", async () => {
        const { order } = await orderWithPendingPayment();

        await confirmPayment(event(order.reference, order.totalCents));
        expect(await confirmPayment(event(order.reference, order.totalCents))).toBe("duplicate");
        expect(await db.payment.count({ where: { status: "PAID" } })).toBe(1);
    });

    it("never accepts a different amount, and a later correct delivery still works", async () => {
        const { order } = await orderWithPendingPayment();

        expect(await confirmPayment(event(order.reference, 1))).toBe("amount_mismatch");
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("AWAITING_PAYMENT");

        expect(await confirmPayment(event(order.reference, order.totalCents))).toBe("paid");
    });

    it("processes concurrent deliveries of one event exactly once", async () => {
        const { order } = await orderWithPendingPayment();
        const outcomes = await Promise.allSettled(
            Array.from({ length: 5 }, () => confirmPayment(event(order.reference, order.totalCents))),
        );
        const values = outcomes.filter((outcome) => outcome.status === "fulfilled").map((outcome) => outcome.value);

        expect(values.filter((value) => value === "paid")).toHaveLength(1);
        expect(await db.payment.count({ where: { status: "PAID" } })).toBe(1);
        expect(await db.orderEvent.count({ where: { orderId: order.id, toStatus: "PAID" } })).toBe(1);
    });
});

describe("confirmBankTransfer (backoffice)", () => {
    it("confirms once even when submitted twice at the same time", async () => {
        const { order } = await orderWithPendingPayment("MANUAL");
        const admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });

        const results = await Promise.allSettled([
            confirmBankTransfer(admin, { reference: order.reference }),
            confirmBankTransfer(admin, { reference: order.reference }),
        ]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
        expect(await db.payment.count({ where: { orderId: order.id, status: "PAID" } })).toBe(1);
        expect(await db.adminAuditLog.count({ where: { action: "payment.confirm_manual" } })).toBe(1);
    });
});
