import "server-only";

import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("email");

export type OutgoingEmail = {
    to: string;
    subject: string;
    html: string;
    text: string;
    /** Same key → the provider sends at most once (safe retries). */
    idempotencyKey: string;
};

/** `retryable: false` for errors a retry cannot fix (invalid recipient, bad key). */
export class EmailProviderError extends Error {
    constructor(
        message: string,
        readonly retryable: boolean,
    ) {
        super(message);
        this.name = "EmailProviderError";
    }
}

export type EmailProvider = { name: string; send(email: OutgoingEmail): Promise<{ id: string }> };

/** Development: logs instead of sending (no personal data beyond the recipient). */
const consoleProvider: EmailProvider = {
    name: "console",
    async send(email) {
        logger.info("Email (console provider, not sent)", { to: email.to, subject: email.subject, text: email.text });
        return { id: `console-${email.idempotencyKey}` };
    },
};

const resendProvider: EmailProvider = {
    name: "resend",
    async send(email) {
        if (!env.RESEND_API_KEY) {
            throw new EmailProviderError("RESEND_API_KEY is not set", false);
        }

        let response: Response;

        try {
            response = await fetch(`${env.RESEND_API_URL}/emails`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                    "Idempotency-Key": email.idempotencyKey,
                },
                body: JSON.stringify({
                    from: env.EMAIL_FROM,
                    to: [email.to],
                    subject: email.subject,
                    html: email.html,
                    text: email.text,
                    ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}),
                }),
                signal: AbortSignal.timeout(10_000),
            });
        } catch (error) {
            throw new EmailProviderError(`Resend unreachable: ${error instanceof Error ? error.message : String(error)}`, true);
        }

        if (!response.ok) {
            const detail = (await response.text()).slice(0, 300);
            // 429 and 5xx are temporary; other 4xx (validation, auth) are not.
            throw new EmailProviderError(`Resend ${response.status}: ${detail}`, response.status === 429 || response.status >= 500);
        }

        const body = (await response.json()) as { id?: string };
        return { id: body.id ?? "" };
    },
};

let warned = false;

export function getEmailProvider(): EmailProvider {
    if (env.EMAIL_PROVIDER === "resend") return resendProvider;

    if (env.NODE_ENV === "production" && !warned) {
        warned = true;
        logger.warn("EMAIL_PROVIDER=console: emails are logged, not sent. Set EMAIL_PROVIDER=resend in production.");
    }

    return consoleProvider;
}
