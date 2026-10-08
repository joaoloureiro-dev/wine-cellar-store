import { beforeEach, describe, expect, it } from "vitest";

import { REMOVED_CUSTOMER } from "@/lib/account/deletion";
import { buildAccountExport } from "@/lib/account/export";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { transitionOrderStatus, placeOrder } from "@/lib/orders/service";
import { checkoutInput, createProduct, resetDatabase } from "../support/db";

const origin = process.env.APP_URL!;
const password = "garrafeira-2026";

beforeEach(async () => {
    await resetDatabase();
});

/** Calls Better Auth over HTTP, like the browser does (rate limit, origin check, hooks). */
async function call(path: string, body: unknown, cookie?: string) {
    const response = await auth.handler(
        new Request(`${origin}/api/auth${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Origin: origin, "x-forwarded-for": `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`, ...(cookie ? { Cookie: cookie } : {}) },
            body: JSON.stringify(body),
        }),
    );

    return { status: response.status, body: await response.json().catch(() => null), cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") };
}

async function signUp(email = "rita@example.pt") {
    const response = await call("/sign-up/email", { name: "Rita Costa", email, password });
    expect(response.status).toBe(200);

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    return { user, cookie: response.cookie };
}

describe("account deletion", () => {
    it("requires the password, then removes the account and keeps orders unlinked", async () => {
        const { user, cookie } = await signUp();
        const product = await createProduct({ stock: 5 });
        await db.address.create({ data: { userId: user.id, recipientName: "Rita Costa", phone: "912345678", addressLine1: "Rua A 1", postalCode: "1000-001", city: "Lisboa" } });
        await db.favorite.create({ data: { userId: user.id, productId: product.id } });

        const { reference } = await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 1 }], { userId: user.id });
        await transitionOrderStatus({ reference, to: "CANCELLED", actor: "CUSTOMER" });
        const reservation = await db.reservation.create({
            data: {
                reference: "RSV-TESTE001",
                status: "EXPIRED",
                productId: product.id,
                quantity: 1,
                unitPriceCents: 49_900,
                customerName: "Rita Costa",
                customerEmail: "rita@example.pt",
                customerPhone: "912345678",
                customerNotes: "Ligar à tarde",
                privacyConsentAt: new Date(),
                userId: user.id,
            },
        });

        expect((await call("/delete-user", {}, cookie)).body).toMatchObject({ code: "PASSWORD_REQUIRED" });
        expect((await call("/delete-user", { password: "wrong-password-1" }, cookie)).body).toMatchObject({ code: "INVALID_PASSWORD" });
        expect(await db.user.count({ where: { id: user.id } })).toBe(1);

        expect((await call("/delete-user", { password }, cookie)).status).toBe(200);

        expect(await db.user.count({ where: { id: user.id } })).toBe(0);
        expect(await db.address.count()).toBe(0);
        expect(await db.favorite.count()).toBe(0);
        expect(await db.session.count()).toBe(0);
        expect(await db.account.count()).toBe(0);
        expect(await db.order.findUniqueOrThrow({ where: { reference } })).toMatchObject({ userId: null, customerName: checkoutInput().name });
        expect(await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).toMatchObject({
            userId: null,
            customerName: REMOVED_CUSTOMER.name,
            customerEmail: REMOVED_CUSTOMER.email,
            customerPhone: "",
            customerNotes: null,
        });
    });

    it.each([
        ["an order in progress", "OPEN_ORDERS"],
        ["an active reservation", "OPEN_RESERVATIONS"],
        ["a backoffice role", "ADMIN_ACCOUNT"],
    ])("is refused with %s", async (_case, code) => {
        const { user, cookie } = await signUp();
        const product = await createProduct({ stock: 5 });

        if (code === "OPEN_ORDERS") await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 1 }], { userId: user.id });
        if (code === "ADMIN_ACCOUNT") await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
        if (code === "OPEN_RESERVATIONS") {
            await db.reservation.create({
                data: {
                    reference: "RSV-TESTE002",
                    productId: product.id,
                    quantity: 1,
                    unitPriceCents: 49_900,
                    customerName: "Rita",
                    customerEmail: "rita@example.pt",
                    customerPhone: "912345678",
                    privacyConsentAt: new Date(),
                    userId: user.id,
                },
            });
        }

        expect((await call("/delete-user", { password }, cookie)).body).toMatchObject({ code });
        expect(await db.user.count({ where: { id: user.id } })).toBe(1);
    });
});

describe("data export", () => {
    it("contains the account's own records only", async () => {
        const { user } = await signUp();
        const product = await createProduct({ stock: 5 });
        await placeOrder(checkoutInput(), [{ productId: product.id, quantity: 2 }], { userId: user.id });
        // A guest order with the same email is not proven to be theirs.
        await placeOrder(checkoutInput({ email: "rita@example.pt" }), [{ productId: product.id, quantity: 1 }]);
        await db.favorite.create({ data: { userId: user.id, productId: product.id } });

        const data = await buildAccountExport(user.id);

        expect(data.account).toMatchObject({ name: "Rita Costa", email: "rita@example.pt", signInMethods: [{ method: "password" }] });
        expect(data.orders).toHaveLength(1);
        expect(data.orders[0].items[0]).toMatchObject({ quantity: 2 });
        expect(data.favorites[0].url).toMatch(/^https:\/\/.+\/caves\//);
        const { password: hash } = await db.account.findFirstOrThrow({ where: { userId: user.id } });
        const json = JSON.stringify(data);
        expect(json).not.toContain(hash!);
        expect(json).not.toMatch(/internalNotes|idempotencyKey|"id"|userId/);
    });
});
