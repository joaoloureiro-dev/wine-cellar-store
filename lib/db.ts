import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/generated/prisma/client";
import { READ_OPERATIONS, retryTransient } from "@/lib/db-retry";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("db");

/**
 * Pool whose connect() retries transient failures (Neon scaling from zero,
 * restarting or failing over). Safe for every query, writes included: no
 * statement has been sent while a connection is still being acquired.
 */
class ResilientPool extends pg.Pool {
    connect(): Promise<pg.PoolClient>;
    connect(callback: (error: Error | undefined, client: pg.PoolClient | undefined, done: (release?: unknown) => void) => void): void;
    connect(callback?: Parameters<pg.Pool["connect"]>[0]) {
        if (callback) {
            return super.connect(callback);
        }

        return retryTransient(() => super.connect(), {
            onRetry: (attempt, error) => log.warn("Retrying database connection", { attempt, error }),
        });
    }
}

/**
 * Single PrismaClient per process. Each client owns a connection pool, so
 * in development the instance is cached on globalThis to survive hot reloads.
 *
 * Built for a managed, highly available PostgreSQL (Neon):
 * - bounded pool, connect timeout covering a cold start, client-side query
 *   timeout so a stuck connection never hangs a request;
 * - acquiring a connection is retried for every query (nothing sent yet);
 * - reads are also retried when a connection drops mid-query; writes are
 *   not, since replaying them could duplicate an order (lib/db-retry.ts).
 */
function createPrismaClient(): PrismaClient {
    const pool = new ResilientPool({
        connectionString: env.DATABASE_URL,
        max: env.DATABASE_POOL_MAX,
        connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT_MS,
        idleTimeoutMillis: 30_000,
        query_timeout: 20_000,
        keepAlive: true,
    });
    // An idle client dying (e.g. Neon restarting) must not crash the process.
    pool.on("error", (error) => log.warn("Idle database connection closed", { error }));

    const client = new PrismaClient({
        adapter: new PrismaPg(pool),
        log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    // The extension only intercepts queries; model methods keep their exact
    // signatures, so the client is still typed as a plain PrismaClient
    // (keeps Prisma.TransactionClient usable across the codebase).
    return client.$extends({
        name: "transient-read-retry",
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    if (!READ_OPERATIONS.has(operation)) {
                        return query(args);
                    }

                    return retryTransient(() => query(args), {
                        onRetry: (attempt, error) => log.warn("Retrying read after a transient database error", { model, operation, attempt, error }),
                    });
                },
            },
        },
    }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
