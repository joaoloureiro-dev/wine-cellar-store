import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { getStripe } from "@/lib/payments/providers/klarna";
import { confirmPayment, failPayment } from "@/lib/payments/service";
import { MAX_WEBHOOK_BODY_BYTES } from "@/lib/payments/webhooks/verify";

const log = createLogger("webhooks.stripe");

/**
 * Stripe webhooks (Klarna via Checkout). The Stripe-Signature header is
 * verified with the endpoint secret before anything is read.
 */
export async function POST(request: Request) {
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const raw = await request.text();

    if (raw.length > MAX_WEBHOOK_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let event: Stripe.Event;

    try {
        event = getStripe().webhooks.constructEvent(
            raw,
            request.headers.get("stripe-signature") ?? "",
            env.STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        log.warn("Rejected webhook: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (!event.type.startsWith("checkout.session.")) {
        return NextResponse.json({ ok: true, outcome: "ignored" });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const base = {
        provider: "STRIPE" as const,
        externalId: event.id,
        providerReference: session.id,
        orderReference: session.client_reference_id ?? undefined,
        payload: {
            type: event.type,
            sessionId: session.id,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            currency: session.currency,
        },
    };

    switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
            // Delayed methods complete the session before the money arrives.
            if (session.payment_status !== "paid") {
                return NextResponse.json({ ok: true, outcome: "awaiting_payment" });
            }

            if (session.currency !== "eur" || session.amount_total === null) {
                return NextResponse.json({ error: "Unexpected currency" }, { status: 400 });
            }

            const outcome = await confirmPayment({ ...base, amountCents: session.amount_total });

            return outcome === "not_found" || outcome === "amount_mismatch"
                ? NextResponse.json({ error: outcome }, { status: outcome === "not_found" ? 404 : 400 })
                : NextResponse.json({ ok: true, outcome });
        }
        case "checkout.session.async_payment_failed": {
            const outcome = await failPayment({ ...base, status: "FAILED", reason: "Klarna payment failed" });
            return NextResponse.json({ ok: true, outcome });
        }
        case "checkout.session.expired": {
            const outcome = await failPayment({ ...base, status: "EXPIRED", reason: "Checkout expired" });
            return NextResponse.json({ ok: true, outcome });
        }
        default:
            return NextResponse.json({ ok: true, outcome: "ignored" });
    }
}
