/**
 * Grants (or revokes) backoffice access to an existing account.
 *
 *   npm run admin:grant -- ana@example.pt
 *   npm run admin:grant -- ana@example.pt --revoke
 *
 * The customer must sign up first; access is never granted from the web.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const [email, flag] = process.argv.slice(2);

if (!email || (flag && flag !== "--revoke")) {
    console.error("Usage: npm run admin:grant -- <email> [--revoke]");
    process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const role = flag === "--revoke" ? "CUSTOMER" : "ADMIN";

async function main() {
    const { count } = await db.user.updateMany({
        where: { email: email.trim().toLowerCase() },
        data: { role },
    });

    if (count === 0) {
        console.error(`No account found for ${email}. Ask them to sign up first.`);
        process.exitCode = 1;
    } else {
        console.log(role === "ADMIN" ? `${email} is now an admin.` : `Admin access revoked for ${email}.`);
    }
}

main().finally(() => db.$disconnect());
