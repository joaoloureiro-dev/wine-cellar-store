import "server-only";

import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (prevents timing attacks on secrets). */
export function safeEqual(a: string, b: string) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);

    return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * eupago Webhook 2.0: `X-Signature` is base64(HMAC-SHA256(payload, secret)).
 * The signed payload is the raw body, or the base64 ciphertext (`data`) when
 * the channel encrypts notifications.
 */
export function verifyEupagoSignature(payload: string, signature: string, secret: string) {
    const expected = createHmac("sha256", secret).update(payload).digest("base64");

    return safeEqual(expected, signature);
}

/** eupago encrypted webhooks: AES-256-CBC, the channel secret is the 32-byte key. */
export function decryptEupagoPayload(data: string, ivBase64: string, secret: string) {
    const key = Buffer.from(secret);

    if (key.length !== 32) {
        throw new Error("EUPAGO_WEBHOOK_SECRET must be 32 bytes to decrypt webhooks");
    }

    const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(ivBase64, "base64"));

    return Buffer.concat([
        decipher.update(Buffer.from(data, "base64")),
        decipher.final(),
    ]).toString("utf8");
}

/** "12.50" → 1250. Returns null for anything that is not a plain amount. */
export function parseAmountToCents(value: unknown) {
    const text = typeof value === "number" ? value.toFixed(2) : String(value ?? "").trim().replace(",", ".");

    if (!/^\d{1,8}(\.\d{1,2})?$/.test(text)) {
        return null;
    }

    return Math.round(Number(text) * 100);
}

/** Webhook bodies are small; reject anything suspiciously large. */
export const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
