import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminTransitionReservation } from "@/lib/admin/reservation-operations";
import { db } from "@/lib/db";
import { dispatchPendingEmails } from "@/lib/email/dispatcher";
import type { EmailProvider, OutgoingEmail } from "@/lib/email/providers";
import { createReservation } from "@/lib/reservations/service";
import { expireOverdueReservations } from "@/lib/reservations/expiry";
import { createProduct, resetDatabase } from "../support/db";

let admin: { id: string; name: string; email: string };

beforeEach(async () => {
    await resetDatabase();
    admin = await db.user.create({ data: { id: "admin-1", name: "Ana", email: "ana@cellarium.test", role: "ADMIN" } });
});

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

const request = (productId: string) =>
    createReservation({ productId, quantity: 1, name: "Miguel Reis", email: "miguel@example.pt", phone: "913222111", notes: undefined, privacyConsent: "on", website: "" });

describe("reservation emails", () => {
    it("acknowledges the request and alerts the shop", async () => {
        const product = await createProduct({ stock: 0 });
        const { reference } = await request(product.id);

        const emails = await sendAll();

        expect(emails.find((email) => email.to === "miguel@example.pt")).toMatchObject({ subject: `Pedido de reserva ${reference} recebido` });
        expect(emails.find((email) => email.to === "loja@cellarium.test")?.text).toContain(`/admin/reservas/${reference}`);
    });

    it("tells the customer until when the unit is held, and when the hold expires", async () => {
        const product = await createProduct({ stock: 3 });
        const { reference } = await request(product.id);
        await sendAll();

        await adminTransitionReservation(admin, { reference, to: "CONFIRMED", holdDays: 5 });
        const [confirmed] = await sendAll();
        expect(confirmed.subject).toBe(`Reserva ${reference} confirmada`);
        expect(confirmed.text).toMatch(/Guardámos a cave para si até \d+ de \w+ de \d{4}/);

        await db.reservation.update({ where: { reference }, data: { expiresAt: new Date(Date.now() - 1000) } });
        await expireOverdueReservations();
        await expireOverdueReservations();

        expect((await sendAll()).map((email) => email.subject)).toEqual([`Reserva ${reference} expirou`]);
    });
});
