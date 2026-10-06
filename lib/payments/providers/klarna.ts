import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";
import { PaymentProviderError } from "@/lib/payments/providers/types";

/**
 * Klarna through Stripe Checkout (hosted page: no card or bank data touches
 * our servers). Confirmation comes from signed Stripe webhooks.
 */

/** Klarna's per-transaction limit for EUR in Portugal (Stripe). */
export const KLARNA_MAX_TOTAL_CENTS = 400_000;
/** Stripe requires Checkout Sessions to live at least 30 minutes. */
const SESSION_TTL_SECONDS = 30 * 60;

let client: Stripe | null = null;

export function getStripe() {
    if (!env.STRIPE_SECRET_KEY) {
        throw new PaymentProviderError("stripe", "STRIPE_SECRET_KEY is not configured");
    }

    if (!client) {
        const base = env.STRIPE_API_BASE_URL ? new URL(env.STRIPE_API_BASE_URL) : null;

        client = new Stripe(env.STRIPE_SECRET_KEY, {
            maxNetworkRetries: 2, // Stripe adds idempotency keys to retries
            timeout: 10_000,
            ...(base
                ? {
                      host: base.hostname,
                      port: base.port,
                      protocol: base.protocol.replace(":", "") as "http" | "https",
                  }
                : {}),
        });
    }

    return client;
}

export function isKlarnaConfigured() {
    return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export async function createKlarnaCheckout({
    paymentId,
    orderReference,
    email,
    items,
    shippingCents,
}: {
    paymentId: string;
    orderReference: string;
    email: string;
    items: { name: string; unitPriceCents: number; quantity: number }[];
    shippingCents: number;
}) {
    const orderUrl = `${env.APP_URL}/encomendas/${orderReference}`;

    const lineItems = items.map((item) => ({
        quantity: item.quantity,
        price_data: {
            currency: "eur",
            unit_amount: item.unitPriceCents,
            product_data: { name: item.name },
        },
    }));

    if (shippingCents > 0) {
        lineItems.push({
            quantity: 1,
            price_data: {
                currency: "eur",
                unit_amount: shippingCents,
                product_data: { name: "Envio" },
            },
        });
    }

    try {
        const session = await getStripe().checkout.sessions.create(
            {
                mode: "payment",
                allowed_payment_method_types: ["klarna"],
                line_items: lineItems,
                customer_email: email,
                client_reference_id: orderReference,
                metadata: { orderReference, paymentId },
                payment_intent_data: { metadata: { orderReference, paymentId } },
                locale: "pt",
                success_url: `${orderUrl}?pagamento=klarna`,
                cancel_url: `${orderUrl}?pagamento=cancelado`,
                expires_at: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
            },
            { idempotencyKey: `klarna-checkout-${paymentId}` },
        );

        if (!session.url) {
            throw new PaymentProviderError("stripe", "Checkout Session without URL");
        }

        return {
            providerReference: session.id,
            checkoutUrl: session.url,
            expiresAt: new Date(session.expires_at * 1000),
        };
    } catch (error) {
        if (error instanceof PaymentProviderError) {
            throw error;
        }

        throw new PaymentProviderError("stripe", "Could not create Klarna checkout", {
            type: error instanceof Stripe.errors.StripeError ? error.type : undefined,
        });
    }
}
