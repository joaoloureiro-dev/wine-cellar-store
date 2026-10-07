import "server-only";

import { createLogger } from "@/lib/logger";
import { isRedisConfigured, redisKeyPrefix, withRedis } from "@/lib/redis";

const log = createLogger("auth.rate-limit");

type Rule = { window: number; max: number };
type Decision = { allowed: boolean; retryAfter: number | null };

/** Per-instance fixed window, used only while Redis is unavailable. */
const localWindows = new Map<string, { count: number; resetAt: number }>();
const MAX_LOCAL_KEYS = 10_000;

function consumeLocally(key: string, rule: Rule): Decision {
    const now = Date.now();
    let window = localWindows.get(key);

    if (!window || window.resetAt <= now) {
        if (localWindows.size >= MAX_LOCAL_KEYS) {
            for (const [entryKey, entry] of localWindows) {
                if (entry.resetAt <= now) localWindows.delete(entryKey);
            }
        }

        window = { count: 0, resetAt: now + rule.window * 1000 };
        localWindows.set(key, window);
    }

    window.count += 1;

    return window.count <= rule.max
        ? { allowed: true, retryAfter: null }
        : { allowed: false, retryAfter: Math.ceil((window.resetAt - now) / 1000) };
}

/**
 * Better Auth rate-limit storage on Redis: one atomic MULTI per request
 * (INCR + EXPIRE NX + TTL), so concurrent attempts across all instances
 * share the same counter and cannot slip past the limit together.
 *
 * If Redis is unavailable, limits keep being enforced per instance rather
 * than failing open (no limit) or closed (nobody can sign in).
 *
 * Returns undefined without REDIS_URL: Better Auth then keeps its counters
 * in PostgreSQL.
 */
export function createRateLimitStorage() {
    if (!isRedisConfigured()) {
        return undefined;
    }

    return {
        async consume(key: string, rule: Rule): Promise<Decision> {
            const redisKey = `${redisKeyPrefix}:rl:${key}`;

            try {
                const [count, , ttl] = await withRedis((client) =>
                    client
                        .multi()
                        .incr(redisKey)
                        .expire(redisKey, rule.window, "NX")
                        .ttl(redisKey)
                        .exec(),
                );

                return Number(count) <= rule.max
                    ? { allowed: true, retryAfter: null }
                    : { allowed: false, retryAfter: Math.max(1, Number(ttl)) };
            } catch (error) {
                log.warn("Redis rate limit unavailable, using per-instance limit", { error });
                return consumeLocally(key, rule);
            }
        },
    };
}
