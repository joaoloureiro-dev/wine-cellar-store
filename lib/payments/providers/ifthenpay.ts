import "server-only";

import { env } from "@/lib/env";
import { CircuitBreaker, fetchWithTimeout, retry, TimeoutError } from "@/lib/resilience";
import {
    centsToDecimalString,
    PaymentProviderError,
    toPortugueseMobile,
    type LocalPaymentProvider,
} from "@/lib/payments/providers/types";

/**
 * ifthenpay adapter.
 *
 * Endpoints and payloads follow ifthenpay's official SDK (@ifthenpay/js-sdk):
 *   POST /spg/payment/mbway              → Status "000" on success
 *   GET  /spg/payment/mbway/status       → Status "000" when paid
 *   POST /multibanco/reference/init      → Status "0" on success
 * Payment confirmation arrives on the callback URL configured in the
 * ifthenpay backoffice (validated with the anti-phishing key).
 */

const MBWAY_REQUEST_TTL_MS = 4 * 60 * 1000;
const breaker = new CircuitBreaker("ifthenpay");

type IfthenpayResponse = Record<string, unknown>;

async function post(path: string, body: Record<string, unknown>) {
    const response = await fetchWithTimeout(`${env.IFTHENPAY_API_URL}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(body),
        timeoutMs: 10_000,
    });

    const data = (await response.json().catch(() => null)) as IfthenpayResponse | null;

    if (!response.ok || !data) {
        throw new PaymentProviderError("ifthenpay", `HTTP ${response.status}`, { path, status: response.status });
    }

    return data;
}

function requireKey(key: string | undefined, name: string) {
    if (!key) {
        throw new PaymentProviderError("ifthenpay", `${name} is not configured`, undefined, "config");
    }

    return key;
}

export const ifthenpay: LocalPaymentProvider & {
    getMbWayStatus(requestId: string): Promise<"PAID" | "NOT_PAID">;
} = {
    id: "IFTHENPAY",

    isConfigured(method) {
        return method === "MBWAY"
            ? Boolean(env.IFTHENPAY_MBWAY_KEY && env.IFTHENPAY_ANTI_PHISHING_KEY)
            : Boolean(env.IFTHENPAY_MULTIBANCO_KEY && env.IFTHENPAY_ANTI_PHISHING_KEY);
    },

    async createMbWayPayment({ orderReference, amountCents, phone, description }) {
        const mbWayKey = requireKey(env.IFTHENPAY_MBWAY_KEY, "IFTHENPAY_MBWAY_KEY");

        // Not retried: a retry could push a second request to the customer's phone.
        const data = await breaker.execute(() =>
            post("/spg/payment/mbway", {
                mbWayKey,
                orderId: orderReference,
                amount: centsToDecimalString(amountCents),
                mobileNumber: `351#${toPortugueseMobile(phone)}`,
                description: description.slice(0, 100),
            }),
        );

        if (data.Status !== "000" || typeof data.RequestId !== "string") {
            throw new PaymentProviderError("ifthenpay", "MB WAY request rejected", {
                status: data.Status,
                message: data.Message,
            }, "rejected");
        }

        return {
            providerReference: data.RequestId,
            expiresAt: new Date(Date.now() + MBWAY_REQUEST_TTL_MS),
        };
    },

    async createMultibancoReference({ orderReference, amountCents, description, expiryDays }) {
        const mbKey = requireKey(env.IFTHENPAY_MULTIBANCO_KEY, "IFTHENPAY_MULTIBANCO_KEY");

        // Safe to retry on timeouts: the same orderId identifies the request.
        const data = await breaker.execute(() =>
            retry(
                () =>
                    post("/multibanco/reference/init", {
                        mbKey,
                        orderId: orderReference,
                        amount: centsToDecimalString(amountCents),
                        description: description.slice(0, 255),
                        expiryDays,
                    }),
                { attempts: 2, shouldRetry: (error) => error instanceof TimeoutError },
            ),
        );

        if (
            String(data.Status) !== "0" ||
            typeof data.Entity !== "string" ||
            typeof data.Reference !== "string"
        ) {
            throw new PaymentProviderError("ifthenpay", "Multibanco reference rejected", {
                status: data.Status,
            }, "rejected");
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);
        expiresAt.setHours(23, 59, 0, 0);

        return {
            providerReference: typeof data.RequestId === "string" ? data.RequestId : null,
            entity: data.Entity,
            reference: data.Reference,
            expiresAt,
        };
    },

    /** Server-side confirmation used to double-check MB WAY callbacks. */
    async getMbWayStatus(requestId) {
        const mbWayKey = requireKey(env.IFTHENPAY_MBWAY_KEY, "IFTHENPAY_MBWAY_KEY");
        const url = new URL(`${env.IFTHENPAY_API_URL}/spg/payment/mbway/status`);
        url.searchParams.set("mbWayKey", mbWayKey);
        url.searchParams.set("requestId", requestId);

        const response = await breaker.execute(() =>
            retry(() => fetchWithTimeout(url, { headers: { accept: "application/json" } }), {
                attempts: 2,
            }),
        );
        const data = (await response.json().catch(() => null)) as IfthenpayResponse | null;

        return data?.Status === "000" ? "PAID" : "NOT_PAID";
    },
};
