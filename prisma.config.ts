import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        // Read directly (not via `env()`) so `prisma generate` also works
        // where no database is configured, e.g. during `npm install`.
        // Migrations use the direct (non-pooled) connection when provided:
        // Neon's pooler (PgBouncer) is meant for the app, not for DDL.
        url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
});
