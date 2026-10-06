import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { ifthenpay } from "@/lib/payments/providers/ifthenpay";
import { confirmPayment, getPaymentMethodByReference } from "@/lib/payments/service";
import { parseAmountToCents, safeEqual } from "@/lib/payments/webhooks/verify";

const log = createLogger("webhooks.ifthenpay");

/**
 * ifthenpay payment callback (GET), configured in the ifthenpay backoffice:
 *   /api/webhooks/ifthenpay?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]
 *
 * ifthenpay callbacks are not HMAC-signed, so they are only trusted when:
 *   1. the anti-phishing key matches (constant-time comparison),
 *   2. the amount matches the stored payment exactly, and
 *   3. for MB WAY, ifthenpay's status API confirms the payment server-side.
 */
export async function GET(request: Request) {
    if (!env.IFTHENPAY_ANTI_PHISHING_KEY) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const params = new URL(request.url).searchParams;
    const key = params.get("key") ?? "";
    const orderReference = params.get("orderId") ?? "";
    const requestId = params.get("requestId") ?? "";
    const amountCents = parseAmountToCents(params.get("amount"));

    if (!safeEqual(key, env.IFTHENPAY_ANTI_PHISHING_KEY)) {
        log.warn("Rejected callback: invalid anti-phishing key", { orderReference });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orderReference || amountCents === null) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (requestId && (await getPaymentMethodByReference("IFTHENPAY", requestId)) === "MBWAY") {
        try {
            if ((await ifthenpay.getMbWayStatus(requestId)) !== "PAID") {
                log.warn("Rejected MB WAY callback: status API does not confirm payment", {
                    orderReference,
                });
                return NextResponse.json({ error: "Payment not confirmed" }, { status: 409 });
            }
        } catch (error) {
            log.error("MB WAY status check failed", { orderReference, error });
            return NextResponse.json({ error: "Temporarily unavailable" }, { status: 503 });
        }
    }

    const outcome = await confirmPayment({
        provider: "IFTHENPAY",
        externalId: requestId || `${orderReference}:${amountCents}`,
        providerReference: requestId || undefined,
        orderReference,
        amountCents,
        // Never store the anti-phishing key.
        payload: Object.fromEntries([...params.entries()].filter(([name]) => name !== "key")),
    });

    return outcomeResponse(outcome);
}

function outcomeResponse(outcome: Awaited<ReturnType<typeof confirmPayment>>) {
    switch (outcome) {
        case "paid":
        case "duplicate":
        case "ignored":
            return NextResponse.json({ ok: true, outcome });
        case "not_found":
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        default:
            return NextResponse.json({ error: outcome }, { status: 400 });
    }
}
