import "server-only";

import type { EmailOutbox } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getEmailProvider, EmailProviderError, type EmailProvider } from "@/lib/email/providers";
import { emailTemplates, type EmailTemplates } from "@/lib/email/templates";
import { createLogger } from "@/lib/logger";

const logger = createLogger("email");

/** Delay before each retry; after the last one the email is marked FAILED. */
export const RETRY_DELAYS_MINUTES = [1, 5, 30, 120, 360];
const CLAIM_SECONDS = 120;
const SENT_RETENTION_DAYS = 30;

/**
 * Claims due emails for this instance. FOR UPDATE SKIP LOCKED plus a lease
 * (lockedUntil): Vercel and Railway can run the sender at the same time
 * without sending an email twice; a crashed sender's lease simply expires.
 */
async function claimDueEmails(limit: number) {
    const claimed = await db.$queryRaw<EmailOutbox[]>`
        UPDATE "EmailOutbox" SET "lockedUntil" = now() + make_interval(secs => ${CLAIM_SECONDS}), "attempts" = "attempts" + 1
        WHERE id IN (
            SELECT id FROM "EmailOutbox"
            WHERE status = 'PENDING' AND "nextAttemptAt" <= now() AND ("lockedUntil" IS NULL OR "lockedUntil" < now())
            ORDER BY "nextAttemptAt", "createdAt"
            LIMIT ${limit}
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *`;

    // RETURNING has no order: send in creation order ("paid" before "shipped").
    return claimed.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
}

async function deliver(email: EmailOutbox, provider: EmailProvider, templates: EmailTemplates) {
    const template = templates[email.type];

    if (!template) {
        await db.emailOutbox.update({ where: { id: email.id }, data: { status: "FAILED", lastError: `Unknown template ${email.type}`, lockedUntil: null } });
        logger.error("Unknown email template", { emailId: email.id, type: email.type });
        return "failed" as const;
    }

    try {
        const rendered = await template(email.payload as Record<string, unknown>);

        if (!rendered) {
            // The subject no longer exists (e.g. data deleted): nothing to send.
            await db.emailOutbox.update({ where: { id: email.id }, data: { status: "SENT", sentAt: new Date(), lastError: "Skipped: nothing to render", lockedUntil: null } });
            return "skipped" as const;
        }

        const { id } = await provider.send({ to: email.recipient, ...rendered, idempotencyKey: email.id });

        await db.emailOutbox.update({
            where: { id: email.id },
            data: {
                status: "SENT",
                sentAt: new Date(),
                providerMessageId: id,
                lastError: null,
                lockedUntil: null,
                // Account emails carry one-time links: do not keep them once sent.
                ...(email.type.startsWith("account.") ? { payload: {} } : {}),
            },
        });
        logger.info("Email sent", { emailId: email.id, type: email.type, provider: provider.name, attempt: email.attempts });
        return "sent" as const;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const retryable = !(error instanceof EmailProviderError) || error.retryable;
        const delay = RETRY_DELAYS_MINUTES[email.attempts - 1];

        if (retryable && delay !== undefined) {
            await db.emailOutbox.update({
                where: { id: email.id },
                data: { lastError: message.slice(0, 500), nextAttemptAt: new Date(Date.now() + delay * 60_000), lockedUntil: null },
            });
            logger.warn("Email delivery failed, will retry", { emailId: email.id, type: email.type, attempt: email.attempts, retryInMinutes: delay, error: message });
            return "retry" as const;
        }

        await db.emailOutbox.update({ where: { id: email.id }, data: { status: "FAILED", lastError: message.slice(0, 500), lockedUntil: null } });
        logger.error("Email delivery failed permanently", { emailId: email.id, type: email.type, attempt: email.attempts, error: message });
        return "failed" as const;
    }
}

/** Sends every due email (in batches). Safe to run concurrently and repeatedly. */
export async function dispatchPendingEmails({
    limit = 50,
    provider = getEmailProvider(),
    templates = emailTemplates,
}: { limit?: number; provider?: EmailProvider; templates?: EmailTemplates } = {}) {
    const result = { sent: 0, skipped: 0, retry: 0, failed: 0 };

    try {
        const due = await claimDueEmails(limit);

        for (const email of due) {
            result[await deliver(email, provider, templates)] += 1;
        }
    } catch (error) {
        logger.error("Email dispatch failed", { error });
    }

    return result;
}

/**
 * Deletes sent emails after SENT_RETENTION_DAYS: the outbox holds
 * recipients and, for account emails, one-time links. Failed ones stay for
 * investigation until handled.
 */
export async function purgeSentEmails() {
    const { count } = await db.emailOutbox.deleteMany({
        where: { status: "SENT", sentAt: { lt: new Date(Date.now() - SENT_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
    });

    return count;
}
