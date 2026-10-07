import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

const shared = {
    resolve: {
        alias: [
            { find: /^@\//, replacement: `${root}` },
            // Next.js enforces server-only at bundle time; tests run on the server.
            { find: /^server-only$/, replacement: `${root}tests/support/server-only.ts` },
        ],
    },
};

/**
 * - unit: pure business rules, no database (fast, run on every change).
 * - integration: real PostgreSQL (DATABASE_URL); covers transactions,
 *   concurrency and constraints that mocks would hide.
 */
export default defineConfig({
    test: {
        projects: [
            {
                ...shared,
                test: {
                    name: "unit",
                    include: ["tests/unit/**/*.test.ts"],
                    environment: "node",
                    env: {
                        DATABASE_URL: "postgresql://unit:unit@localhost:5432/unit",
                        BETTER_AUTH_SECRET: "unit-test-secret-unit-test-secret-0000",
                        APP_URL: "https://cellarium.test",
                    },
                },
            },
            {
                ...shared,
                test: {
                    name: "integration",
                    include: ["tests/integration/**/*.test.ts"],
                    environment: "node",
                    setupFiles: ["tests/support/integration-setup.ts"],
                    // One database: run files one after another.
                    fileParallelism: false,
                    testTimeout: 20_000,
                },
            },
        ],
    },
});
