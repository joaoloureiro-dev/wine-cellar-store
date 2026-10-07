/**
 * Transient database failures: the connection dropped or could not be
 * opened (Neon compute restarting or scaling from zero, failover, network
 * blip). Errors from the query itself (constraint, syntax) are not
 * transient and are never retried.
 */
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const TRANSIENT_MESSAGE =
    /can't reach database server|connection terminated|server closed the connection|ECONNRESET|ECONNREFUSED|ETIMEDOUT|timeout exceeded when trying to connect|Connection terminated due to connection timeout/i;

export function isTransientDbError(error: unknown) {
    if (typeof error !== "object" || error === null) return false;

    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true;

    const message = (error as { message?: unknown }).message;
    return typeof message === "string" && TRANSIENT_MESSAGE.test(message);
}

/** Model operations that only read: safe to run again. */
export const READ_OPERATIONS = new Set([
    "findUnique",
    "findUniqueOrThrow",
    "findFirst",
    "findFirstOrThrow",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
]);

const DELAYS_MS = [200, 600, 1_400];

/**
 * Runs an operation that is safe to repeat (a read, or acquiring a
 * connection), retrying transient failures with backoff (about 2s in
 * total, enough to ride out a Neon restart or failover). Writes never go
 * through here: replaying an INSERT after a lost connection could create
 * a duplicate order.
 */
export async function retryTransient<T>(
    run: () => Promise<T>,
    { delays = DELAYS_MS, onRetry }: { delays?: number[]; onRetry?: (attempt: number, error: unknown) => void } = {},
): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
        try {
            return await run();
        } catch (error) {
            if (attempt >= delays.length || !isTransientDbError(error)) {
                throw error;
            }

            onRetry?.(attempt + 1, error);
            await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
        }
    }
}
