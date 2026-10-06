import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Single PrismaClient per process. Each client owns a connection pool, so
 * in development the instance is cached on globalThis to survive hot reloads.
 */
function createPrismaClient() {
    return new PrismaClient({
        adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
        log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

const globalForPrisma = globalThis as unknown as {
    prisma?: ReturnType<typeof createPrismaClient>;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
