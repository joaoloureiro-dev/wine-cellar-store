import "server-only";

import { createClient } from "redis";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { CircuitBreaker, TimeoutError } from "@/lib/resilience";

const log = createLogger("redis");

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as {
    cellariumRedis?: RedisClient;
    cellariumRedisConnecting?: Promise<unknown>;
};

export const redisKeyPrefix = env.REDIS_KEY_PREFIX ?? "cellarium";

const breaker = new CircuitBreaker("redis", 3, 30_000);

function getClient(): RedisClient | null {
    if (!env.REDIS_URL) {
        return null;
    }

    if (!globalForRedis.cellariumRedis) {
        const client = createClient({
            url: env.REDIS_URL,
            // Fail fast while disconnected; callers fall back instead of waiting.
            disableOfflineQueue: true,
            socket: {
                connectTimeout: 2_000,
                reconnectStrategy: (retries) => Math.min(250 * 2 ** retries, 10_000),
            },
        });

        client.on("error", (error: unknown) => log.warn("Redis connection error", { error }));
        globalForRedis.cellariumRedisConnecting = client.connect().catch(() => {});
        globalForRedis.cellariumRedis = client;
    }

    return globalForRedis.cellariumRedis;
}

export function isRedisConfigured() {
    return Boolean(env.REDIS_URL);
}

/**
 * Runs a Redis command with a timeout behind a circuit breaker. Throws when
 * Redis is not configured, unavailable or slow: callers decide the fallback.
 */
export async function withRedis<T>(operation: (client: RedisClient) => Promise<T>, timeoutMs = 250): Promise<T> {
    const client = getClient();

    if (!client) {
        throw new Error("Redis is not configured");
    }

    // Give the very first commands up to 1s for the initial connection.
    if (!client.isReady && globalForRedis.cellariumRedisConnecting) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
            globalForRedis.cellariumRedisConnecting,
            new Promise((resolve) => (timer = setTimeout(resolve, 1_000))),
        ]);
        clearTimeout(timer);
        globalForRedis.cellariumRedisConnecting = undefined;
    }

    return breaker.execute(async () => {
        if (!client.isReady) {
            throw new Error("Redis not ready");
        }

        let timer: ReturnType<typeof setTimeout> | undefined;

        try {
            return await Promise.race([
                operation(client),
                new Promise<never>((_, reject) => {
                    timer = setTimeout(() => reject(new TimeoutError("Redis timeout")), timeoutMs);
                }),
            ]);
        } finally {
            clearTimeout(timer);
        }
    });
}
