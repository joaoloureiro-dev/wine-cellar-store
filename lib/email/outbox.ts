import "server-only";

import { after } from "next/server";

import type { Prisma } from "@/generated/prisma/client";

export type EmailToQueue = {
    type: string;
    to: string;
    /** Ids the template loads at send time. */
    payload: Prisma.InputJsonObject;
    /** One email per event: a repeated key is ignored. */
    dedupeKey: string;
};

/**
 * Records an email in the caller's transaction (outbox pattern): it exists
 * only if the change that caused it commits. Delivery starts after the
 * response is sent; the scheduled job retries anything left.
 */
export async function enqueueEmail(tx: Prisma.TransactionClient, email: EmailToQueue) {
    await tx.emailOutbox.createMany({
        data: [{ type: email.type, recipient: email.to, payload: email.payload, dedupeKey: email.dedupeKey }],
        skipDuplicates: true,
    });

    scheduleEmailDispatch();
}

/**
 * Sends due emails once the current request has finished (and its
 * transaction committed). Outside a request (scripts, tests) it does
 * nothing: the scheduled job picks the emails up.
 */
export function scheduleEmailDispatch() {
    try {
        after(async () => {
            const { dispatchPendingEmails } = await import("@/lib/email/dispatcher");
            await dispatchPendingEmails();
        });
    } catch {
        // No request scope.
    }
}
