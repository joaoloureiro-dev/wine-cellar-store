import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../../generated/prisma/client";
import { E2E_PASSWORD, e2eUsers } from "./users";

/**
 * Creates the accounts the suite signs in with directly in the database
 * (same scrypt hash Better Auth uses), so tests do not spend the sign-up
 * rate limit. Only the sign-up test itself goes through /api/auth.
 *
 * Run with tsx (see global-setup.ts): Playwright's loader cannot load the
 * generated Prisma client.
 */
async function seedUsers() {
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    const password = await hashPassword(E2E_PASSWORD);

    try {
        for (const user of Object.values(e2eUsers)) {
            await db.user.deleteMany({ where: { email: user.email } });
            await db.user.create({
                data: {
                    id: `e2e-${user.role.toLowerCase()}`,
                    name: user.name,
                    email: user.email,
                    emailVerified: true,
                    role: user.role,
                    accounts: {
                        create: { id: `e2e-${user.role.toLowerCase()}-credential`, accountId: `e2e-${user.role.toLowerCase()}`, providerId: "credential", password },
                    },
                },
            });
        }
    } finally {
        await db.$disconnect();
    }
}

seedUsers().catch((error) => {
    console.error(error);
    process.exit(1);
});
