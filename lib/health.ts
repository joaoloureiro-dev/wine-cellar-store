import "server-only";

import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { isRedisConfigured, withRedis } from "@/lib/redis";

const log = createLogger("health");

type CheckResult = "ok" | "down" | "disabled";

async function withTimeout<T>(operation: Promise<T>, ms: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            operation,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

async function checkDatabase(): Promise<CheckResult> {
    try {
        await withTimeout(db.$queryRaw`SELECT 1`, 1_500);
        return "ok";
    } catch (error) {
        log.error("Database health check failed", { error });
        return "down";
    }
}

async function checkRedis(): Promise<CheckResult> {
    if (!isRedisConfigured()) {
        return "disabled";
    }

    try {
        await withRedis((client) => client.ping(), 500);
        return "ok";
    } catch (error) {
        log.warn("Redis health check failed", { error });
        return "down";
    }
}

/**
 * Readiness for load balancers. PostgreSQL is required; Redis is optional
 * (the app falls back to per-instance caches), so a Redis outage reports
 * "degraded" while the instance keeps receiving traffic.
 */
export async function getReadiness() {
    const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);
    const status = database !== "ok" ? "down" : redis === "down" ? "degraded" : "ok";

    return { status, checks: { database, redis } } as const;
}
