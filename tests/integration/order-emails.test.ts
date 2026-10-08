import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { dispatchPendingEmails } from "@/lib/email/dispatcher";
import type { EmailProvider, OutgoingEmail } from "@/lib/email/providers";
import { expireOverdueOrders } from "@/lib/orders/expiry";
import { placeOrder, transitionOrderStatus } from "@/lib/orders/service";
import { confirmPayment } from "@/lib/payments/service";
import { checkoutInput, createProduct, resetDatabase } from "../support/db";

beforeEach(resetDatabase);

async function sendAll() {
    const sent: OutgoingEmail[] = [];
    const provider: EmailProvider = {
        name: "fake",
        send: vi.fn(async (email) => {
            sent.push(email);
            return { id: `msg-${sent.length}` };
        }),
    };
    await dispatchPendingEmails({ provider });
    return sent;
}

async function multibancoOrder() {
    const product = await createProduct({ stock: 5, priceCents: 129_900 });
    const { reference } = await placeOrder(checkoutInput({ paymentMethod: "MULTIBANCO", email: "rita@example.pt" }), [{ productId: product.id, quantity: 1 }]);
    const order = await db.order.findUniqueOrThrow({ where: { reference } });
    // As the checkout does right after placing the order.
    await db.payment.create({
        data: { orderId: order.id, provider: "IFTHENPAY", method: "MULTIBANCO", amountCents: order.totalCents, providerReference: `ref-${reference}`, mbEntity: "12345", mbReference: "123456789" },
    });

    return order;
}

describe("order emails", () => {
    it("confirms the order with the payment details known at send time", async () => {
        const order = await multibancoOrder();

        const [email, ...others] = await sendAll();

        expect(others).toHaveLength(0);
        expect(email.to).toBe("rita@example.pt");
        expect(email.subject).toBe(`Encomenda ${order.reference} recebida`);
        expect(email.text).toContain("Entidade: 12345");
        expect(email.text).toContain("Referência: 123 456 789");
        expect(email.text).toMatch(/Total: 1\s?299,00\s€/);
        expect(email.text).toContain(`/encomendas/${order.reference}`);
        expect(email.html).toContain("Rita");
    });

    it("tells the customer about payment, shipping and delivery, but not internal steps", async () => {
        const order = await multibancoOrder();
        await sendAll();

        await confirmPayment({
            provider: "IFTHENPAY",
            externalId: `evt-${order.reference}`,
            orderReference: order.reference,
            providerReference: `ref-${order.reference}`,
            amountCents: order.totalCents,
            payload: {},
        });
        for (const to of ["PROCESSING", "SHIPPED", "DELIVERED"] as const) {
            await transitionOrderStatus({ reference: order.reference, to, actor: "ADMIN" });
        }

        const subjects = (await sendAll()).map((email) => email.subject);
        expect(subjects).toEqual([
            `Pagamento confirmado · ${order.reference}`,
            `A sua encomenda ${order.reference} foi enviada`,
            `Encomenda ${order.reference} entregue`,
        ]);
    });

    it("explains an expired order once, even if the job runs twice", async () => {
        const order = await multibancoOrder();
        await sendAll();
        await db.order.update({ where: { id: order.id }, data: { paymentDueAt: new Date(Date.now() - 1000) } });

        await expireOverdueOrders();
        await expireOverdueOrders();

        const emails = await sendAll();
        expect(emails.map((email) => email.subject)).toEqual([`Encomenda ${order.reference} expirou`]);
    });

    it("sends nothing when placing the order fails", async () => {
        const product = await createProduct({ stock: 0 });

        await expect(placeOrder(checkoutInput(), [{ productId: product.id, quantity: 1 }])).rejects.toThrow();
        expect(await db.emailOutbox.count()).toBe(0);
    });
});
