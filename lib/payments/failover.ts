import { CircuitOpenError, TimeoutError } from "@/lib/resilience";
import { PaymentProviderError } from "@/lib/payments/providers/types";

type LocalMethod = "MBWAY" | "MULTIBANCO";

/** Network errors raised before the request could reach the provider. */
const CONNECT_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "EAI_AGAIN",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "UND_ERR_CONNECT_TIMEOUT",
]);

function errorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) return undefined;
    const cause = (error as { cause?: unknown }).cause;
    const fromCause = typeof cause === "object" && cause !== null ? (cause as { code?: unknown }).code : undefined;
    const own = (error as { code?: unknown }).code;

    return typeof fromCause === "string" ? fromCause : typeof own === "string" ? own : undefined;
}

/**
 * Whether a failed payment request may be retried with the secondary
 * provider.
 *
 * - Always safe when nothing reached the provider: circuit open, not
 *   configured, or a connection-phase network error.
 * - Never after the provider rejected the request (the other would too).
 * - Ambiguous failures (timeout, HTTP error): safe for Multibanco, since a
 *   reference the customer never sees cannot be paid; NOT for MB WAY, where
 *   the first provider may already have pushed a request to the phone and a
 *   second one could lead to a double payment.
 */
export function isSafeToFailOver(method: LocalMethod, error: unknown): boolean {
    if (error instanceof CircuitOpenError) return true;

    if (error instanceof PaymentProviderError) {
        if (error.kind === "config") return true;
        if (error.kind === "rejected") return false;
        return method === "MULTIBANCO";
    }

    const code = errorCode(error);
    if (code && CONNECT_ERROR_CODES.has(code)) return true;

    if (error instanceof TimeoutError) return method === "MULTIBANCO";

    return method === "MULTIBANCO";
}
