import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { dispatchPendingEmails, purgeSentEmails } from "@/lib/email/dispatcher";
import { enqueueEmail } from "@/lib/email/outbox";
import { EmailProviderError, type EmailProvider } from "@/lib/email/providers";
import type { EmailTemplates } from "@/lib/email/templates";
import { resetDatabase } from "../support/db";

beforeEach(async () => {
    await resetDatabase();
});

const templates: EmailTemplates = {
    "test.hello": async (payload) => ({ subject: `Olá ${payload.name}`, html: "<p>Olá</p>", text: "Olá" }),
    "test.gone": async () => null,
};

function fakeProvider(behaviour: (call: number) => void = () => {}) {
    const sent: { to: string; subject: string; idempotencyKey: string }[] = [];
    let calls = 0;
    const provider: EmailProvider = {
        name: "fake",
        send: vi.fn(async (email) => {
            calls += 1;
            behaviour(calls);
            sent.push({ to: email.to, subject: email.subject, idempotencyKey: email.idempotencyKey });
            return { id: `msg-${sent.length}` };
        }),
    };

    return { provider, sent };
}

const queue = (dedupeKey: string, type = "test.hello") =>
    db.$transaction((tx) => enqueueEmail(tx, { type, to: "rita@example.pt", payload: { name: "Rita" }, dedupeKey }));

describe("email outbox", () => {
    it("sends each queued email once, even with several senders at the same time", async () => {
        for (let index = 0; index < 12; index += 1) await queue(`hello:${index}`);
        await queue("hello:0"); // same event again: ignored

        const { provider, sent } = fakeProvider();
        await Promise.all([1, 2, 3].map(() => dispatchPendingEmails({ provider, templates, limit: 5 })));
        await dispatchPendingEmails({ provider, templates });

        expect(sent).toHaveLength(12);
        expect(new Set(sent.map((email) => email.idempotencyKey)).size).toBe(12);
        expect(await db.emailOutbox.count({ where: { status: "SENT", providerMessageId: { not: null } } })).toBe(12);
    });

    it("is not sent when the transaction that queued it rolls back", async () => {
        await expect(
            db.$transaction(async (tx) => {
                await enqueueEmail(tx, { type: "test.hello", to: "rita@example.pt", payload: { name: "Rita" }, dedupeKey: "rolled-back" });
                throw new Error("checkout failed");
            }),
        ).rejects.toThrow("checkout failed");

        expect(await db.emailOutbox.count()).toBe(0);
    });

    it("retries temporary failures with a delay, then delivers", async () => {
        await queue("retry");
        const { provider, sent } = fakeProvider((call) => {
            if (call === 1) throw new EmailProviderError("Resend 503", true);
        });

        expect(await dispatchPendingEmails({ provider, templates })).toMatchObject({ retry: 1 });
        const pending = await db.emailOutbox.findFirstOrThrow();
        expect(pending).toMatchObject({ status: "PENDING", attempts: 1, lastError: "Resend 503" });
        expect(pending.nextAttemptAt.getTime()).toBeGreaterThan(Date.now() + 50_000);

        // Not due yet.
        expect(await dispatchPendingEmails({ provider, templates })).toMatchObject({ sent: 0, retry: 0 });

        await db.emailOutbox.update({ where: { id: pending.id }, data: { nextAttemptAt: new Date() } });
        expect(await dispatchPendingEmails({ provider, templates })).toMatchObject({ sent: 1 });
        expect(sent).toHaveLength(1);
    });

    it("gives up on permanent errors and after the last retry", async () => {
        await queue("permanent");
        const permanent = fakeProvider(() => {
            throw new EmailProviderError("Resend 422: invalid to", false);
        });
        expect(await dispatchPendingEmails({ provider: permanent.provider, templates })).toMatchObject({ failed: 1 });

        await queue("exhausted");
        await db.emailOutbox.update({ where: { dedupeKey: "exhausted" }, data: { attempts: 5 } });
        const flaky = fakeProvider(() => {
            throw new EmailProviderError("Resend 500", true);
        });
        expect(await dispatchPendingEmails({ provider: flaky.provider, templates })).toMatchObject({ failed: 1 });

        expect(await db.emailOutbox.count({ where: { status: "FAILED" } })).toBe(2);
    });

    it("skips emails whose subject is gone and fails unknown templates", async () => {
        await queue("gone", "test.gone");
        await queue("unknown", "test.unknown");

        const { provider, sent } = fakeProvider();
        expect(await dispatchPendingEmails({ provider, templates })).toMatchObject({ skipped: 1, failed: 1 });
        expect(sent).toHaveLength(0);
    });

    it("purges sent emails after 30 days", async () => {
        await queue("old");
        await queue("recent");
        await db.emailOutbox.updateMany({ data: { status: "SENT", sentAt: new Date() } });
        await db.emailOutbox.update({ where: { dedupeKey: "old" }, data: { sentAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });

        expect(await purgeSentEmails()).toBe(1);
        expect(await db.emailOutbox.findMany({ select: { dedupeKey: true } })).toEqual([{ dedupeKey: "recent" }]);
    });
});
