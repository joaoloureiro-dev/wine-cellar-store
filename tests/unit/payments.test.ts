import { createCipheriv, createHmac, randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
    decryptEupagoPayload,
    parseAmountToCents,
    safeEqual,
    verifyEupagoSignature,
} from "@/lib/payments/webhooks/verify";

describe("parseAmountToCents", () => {
    it.each([
        ["12.50", 1250],
        ["12,5", 1250],
        [548, 54800],
        ["0.01", 1],
    ])("parses %s", (input, cents) => {
        expect(parseAmountToCents(input)).toBe(cents);
    });

    it.each(["", "abc", "-5", "1e3", "12.345", null, undefined])("rejects %s", (input) => {
        expect(parseAmountToCents(input)).toBeNull();
    });
});

describe("eupago webhooks", () => {
    const secret = "0123456789abcdef0123456789abcdef";

    it("accepts a correct HMAC signature and rejects a tampered body", () => {
        const body = JSON.stringify({ transaction: { identifier: "ENC-ABC", amount: 548 } });
        const signature = createHmac("sha256", secret).update(body).digest("base64");

        expect(verifyEupagoSignature(body, signature, secret)).toBe(true);
        expect(verifyEupagoSignature(body.replace("548", "1"), signature, secret)).toBe(false);
        expect(verifyEupagoSignature(body, signature, "another-secret")).toBe(false);
    });

    it("decrypts AES-256-CBC payloads", () => {
        const iv = randomBytes(16);
        const cipher = createCipheriv("aes-256-cbc", Buffer.from(secret), iv);
        const data = Buffer.concat([cipher.update('{"ok":true}', "utf8"), cipher.final()]).toString("base64");

        expect(decryptEupagoPayload(data, iv.toString("base64"), secret)).toBe('{"ok":true}');
    });

    it("refuses keys that are not 32 bytes", () => {
        expect(() => decryptEupagoPayload("", "", "short")).toThrow(/32 bytes/);
    });
});

describe("safeEqual", () => {
    it("compares strings of any length without throwing", () => {
        expect(safeEqual("abc", "abc")).toBe(true);
        expect(safeEqual("abc", "abcd")).toBe(false);
    });
});
