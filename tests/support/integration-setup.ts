import { tmpdir } from "node:os";

import { vi } from "vitest";

const databaseUrl = process.env.DATABASE_URL ?? "";

// Integration tests truncate tables: refuse anything but a *_test database.
if (!/\/[\w-]+_test(\?|$)/.test(databaseUrl)) {
    throw new Error(
        "Integration tests need DATABASE_URL pointing to a database whose name ends in _test " +
            '(e.g. postgresql://cellarium:cellarium@localhost:5432/cellarium_test). Run "npm run db:test:prepare" first.',
    );
}

process.env.BETTER_AUTH_SECRET ??= "integration-test-secret-0000000000000";
process.env.APP_URL ??= "https://cellarium.test";
// Uploaded photos go to a throwaway folder.
process.env.MEDIA_STORAGE = "local";
process.env.MEDIA_LOCAL_DIR = `${tmpdir()}/cellarium-media-test-${process.pid}`;
// Shop alerts for new orders and reservations.
process.env.ADMIN_NOTIFICATION_EMAIL = "loja@cellarium.test";

// No Next.js request context in tests: cache APIs become no-ops.
vi.mock("next/cache", () => ({
    cacheLife: vi.fn(),
    cacheTag: vi.fn(),
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    updateTag: vi.fn(),
}));
