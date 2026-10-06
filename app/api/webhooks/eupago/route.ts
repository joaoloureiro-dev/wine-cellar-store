import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { confirmPayment, failPayment } from "@/lib/payments/service";
import {
    decryptEupagoPayload,
    MAX_WEBHOOK_BODY_BYTES,
    parseAmountToCents,
    verifyEupagoSignature,
} from "@/lib/payments/webhooks/verify";

const log = createLogger("webhooks.eupago");

const PAID_STATUSES = new Set(["Paid", "paga"]);
const CANCELLED_STATUSES = new Set(["Canceled", "Cancelled", "Cancel", "Expired", "Error"]);

type EupagoTransaction = {
    identifier?: string;
    trid?: string | number;
    amount?: { value?: number | string; currency?: string } | number | string;
    status?: string;
    method?: string;
};

/**
 * eupago Webhook 2.0 (POST, JSON). Only signed notifications are accepted;
 * the unsigned legacy v1 GET format is rejected by design.
 */
export async function POST(request: Request) {
    if (!env.EUPAGO_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const raw = await request.text();

    if (raw.length > MAX_WEBHOOK_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const signature = request.headers.get("x-signature") ?? "";
    const iv = request.headers.get("x-initialization-vector");

    let body: Record<string, unknown>;

    try {
        body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const isEncrypted = typeof body.data === "string" && Boolean(iv);
    const signedPayload = isEncrypted ? (body.data as string) : raw;

    if (!signature || !verifyEupagoSignature(signedPayload, signature, env.EUPAGO_WEBHOOK_SECRET)) {
        log.warn("Rejected webhook: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (isEncrypted) {
        try {
            body = JSON.parse(
                decryptEupagoPayload(body.data as string, iv!, env.EUPAGO_WEBHOOK_SECRET),
            ) as Record<string, unknown>;
        } catch (error) {
            log.error("Could not decrypt webhook", { error });
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }
    }

    const transaction = (body.transaction ?? body.transactions ?? body) as EupagoTransaction;
    const orderReference = transaction.identifier;
    const trid = transaction.trid != null ? String(transaction.trid) : undefined;
    const status = transaction.status ?? "";
    const amountValue =
        typeof transaction.amount === "object" ? transaction.amount?.value : transaction.amount;

    if (!orderReference || !trid) {
        return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
    }

    const event = {
        provider: "EUPAGO" as const,
        externalId: `${trid}:${status}`,
        orderReference,
        providerReference: trid,
        payload: { transaction },
    };

    if (PAID_STATUSES.has(status)) {
        const amountCents = parseAmountToCents(amountValue);

        if (amountCents === null) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const outcome = await confirmPayment({ ...event, amountCents });

        return outcome === "not_found"
            ? NextResponse.json({ error: "Payment not found" }, { status: 404 })
            : outcome === "amount_mismatch"
              ? NextResponse.json({ error: outcome }, { status: 400 })
              : NextResponse.json({ ok: true, outcome });
    }

    if (CANCELLED_STATUSES.has(status)) {
        const outcome = await failPayment({ ...event, status: "CANCELLED", reason: `eupago: ${status}` });
        return NextResponse.json({ ok: true, outcome });
    }

    return NextResponse.json({ ok: true, outcome: "ignored" });
}
