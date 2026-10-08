import "server-only";

import { createHash } from "node:crypto";

import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email/outbox";

type AccountEmailType = "account.password-reset" | "account.password-changed" | "account.verify-email";

/**
 * Queues an account email outside any business transaction (called from
 * Better Auth hooks). One email per one-time token: the dedupe key holds a
 * hash of it, never the token itself.
 */
export async function queueAccountEmail(type: AccountEmailType, { to, name, url, key }: { to: string; name: string; url?: string; key: string }) {
    const hashedKey = createHash("sha256").update(key).digest("hex").slice(0, 32);

    await db.$transaction((tx) => enqueueEmail(tx, { type, to, payload: { name, ...(url ? { url } : {}) }, dedupeKey: `${type}:${hashedKey}` }));
}
