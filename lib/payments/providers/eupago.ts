import "server-only";

import { env } from "@/lib/env";
import { CircuitBreaker, fetchWithTimeout, retry, TimeoutError } from "@/lib/resilience";
import {
    PaymentProviderError,
    toPortugueseMobile,
    type LocalPaymentProvider,
} from "@/lib/payments/providers/types";

/**
 * eupago adapter (REST API).
 *
 *   POST /api/v1.02/mbway/create          (Authorization: ApiKey <key>)
 *   POST /clientes/rest_api/multibanco/create   ({ chave, valor, id, … })
 * Payment confirmation arrives through Webhook 2.0 (HMAC-SHA256 signed).
 *
 * ⚠️ Implemented from eupago's public API reference as exposed by community
 * SDKs; validate against the eupago sandbox before going live.
 */

const MBWAY_REQUEST_TTL_MS = 5 * 60 * 1000;
const breaker = new CircuitBreaker("eupago");

type EupagoResponse = Record<string, unknown>;

async function post(path: string, body: Record<string, unknown>, headers: Record<string, string> = {}) {
    const response = await fetchWithTimeout(`${env.EUPAGO_API_URL}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json", ...headers },
        body: JSON.stringify(body),
        timeoutMs: 10_000,
    });

    const data = (await response.json().catch(() => null)) as EupagoResponse | null;

    if (!response.ok || !data) {
        throw new PaymentProviderError("eupago", `HTTP ${response.status}`, { path, status: response.status });
    }

    return data;
}

function requireApiKey() {
    if (!env.EUPAGO_API_KEY) {
        throw new PaymentProviderError("eupago", "EUPAGO_API_KEY is not configured", undefined, "config");
    }

    return env.EUPAGO_API_KEY;
}

export const eupago: LocalPaymentProvider = {
    id: "EUPAGO",

    isConfigured() {
        return Boolean(env.EUPAGO_API_KEY && env.EUPAGO_WEBHOOK_SECRET);
    },

    async createMbWayPayment({ orderReference, amountCents, phone, description }) {
        const apiKey = requireApiKey();

        // Not retried: a retry could push a second request to the customer's phone.
        const data = await breaker.execute(() =>
            post(
                "/api/v1.02/mbway/create",
                {
                    payment: {
                        amount: { value: amountCents / 100, currency: "EUR" },
                        identifier: orderReference,
                        customerPhone: toPortugueseMobile(phone),
                        countryCode: "351",
                        lang: "PT",
                        description: description.slice(0, 100),
                    },
                },
                { Authorization: `ApiKey ${apiKey}` },
            ),
        );

        if (data.transactionStatus !== "Success" || data.transactionID == null) {
            throw new PaymentProviderError("eupago", "MB WAY request rejected", {
                status: data.transactionStatus,
                code: data.code,
            }, "rejected");
        }

        return {
            providerReference: String(data.transactionID),
            expiresAt: new Date(Date.now() + MBWAY_REQUEST_TTL_MS),
        };
    },

    async createMultibancoReference({ orderReference, amountCents }) {
        const apiKey = requireApiKey();

        // per_dup: 0 lets eupago reject a duplicate id, so retries are safe.
        const data = await breaker.execute(() =>
            retry(
                () =>
                    post("/clientes/rest_api/multibanco/create", {
                        chave: apiKey,
                        valor: amountCents / 100,
                        id: orderReference,
                        per_dup: 0,
                    }),
                { attempts: 2, shouldRetry: (error) => error instanceof TimeoutError },
            ),
        );

        if (data.estado !== 0 || data.entidade == null || data.referencia == null) {
            throw new PaymentProviderError("eupago", "Multibanco reference rejected", {
                estado: data.estado,
            }, "rejected");
        }

        return {
            providerReference: null,
            entity: String(data.entidade),
            reference: String(data.referencia),
            expiresAt: null,
        };
    },
};
