import "server-only";

/**
 * Resilience helpers for calls to external services (payment providers,
 * email, ERP…): timeouts, retries with exponential backoff and a circuit
 * breaker. They keep a slow or failing provider from blocking the store.
 */

export class TimeoutError extends Error {
    constructor(message = "Request timed out") {
        super(message);
        this.name = "TimeoutError";
    }
}

export class CircuitOpenError extends Error {
    constructor(name: string) {
        super(`Circuit "${name}" is open; skipping call.`);
        this.name = "CircuitOpenError";
    }
}

/** fetch with a hard timeout. */
export async function fetchWithTimeout(
    input: string | URL,
    init: RequestInit & { timeoutMs?: number } = {},
) {
    const { timeoutMs = 10_000, ...rest } = init;

    try {
        return await fetch(input, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
        if (error instanceof DOMException && error.name === "TimeoutError") {
            throw new TimeoutError();
        }

        throw error;
    }
}

/**
 * Retries `operation` with exponential backoff and full jitter.
 * Only use for idempotent operations: a retried request must not create a
 * second charge or send the customer a second payment request.
 */
export async function retry<T>(
    operation: () => Promise<T>,
    {
        attempts = 3,
        baseDelayMs = 300,
        maxDelayMs = 3_000,
        shouldRetry = () => true,
    }: {
        attempts?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        shouldRetry?: (error: unknown) => boolean;
    } = {},
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            if (attempt === attempts || !shouldRetry(error)) {
                break;
            }

            const delay = Math.random() * Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Per-process circuit breaker: after `failureThreshold` consecutive failures
 * calls fail fast for `resetAfterMs`, then one trial call is allowed.
 */
export class CircuitBreaker {
    private failures = 0;
    private openedAt: number | null = null;

    constructor(
        private readonly name: string,
        private readonly failureThreshold = 5,
        private readonly resetAfterMs = 30_000,
    ) {}

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.openedAt !== null) {
            if (Date.now() - this.openedAt < this.resetAfterMs) {
                throw new CircuitOpenError(this.name);
            }

            this.openedAt = null; // half-open: allow one trial call
        }

        try {
            const result = await operation();
            this.failures = 0;
            return result;
        } catch (error) {
            this.failures += 1;

            if (this.failures >= this.failureThreshold) {
                this.openedAt = Date.now();
            }

            throw error;
        }
    }
}
