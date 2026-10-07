import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/auth/next-path";
import { isReference, generateReference } from "@/lib/references";
import { isValidNif, mainlandPostalCodeSchema, sanitizeText } from "@/lib/validation/fields";

describe("isValidNif", () => {
    it("accepts NIFs with a valid check digit", () => {
        expect(isValidNif("123456789")).toBe(true);
        expect(isValidNif("501964843")).toBe(true);
    });

    it("rejects a wrong check digit, wrong length or non-digits", () => {
        expect(isValidNif("123456780")).toBe(false);
        expect(isValidNif("12345678")).toBe(false);
        expect(isValidNif("12345678a")).toBe(false);
    });
});

describe("mainlandPostalCodeSchema", () => {
    it("accepts mainland codes", () => {
        expect(mainlandPostalCodeSchema.safeParse("1000-001").success).toBe(true);
        expect(mainlandPostalCodeSchema.safeParse("8999-999").success).toBe(true);
    });

    it("rejects islands and malformed codes", () => {
        expect(mainlandPostalCodeSchema.safeParse("9000-100").success).toBe(false);
        expect(mainlandPostalCodeSchema.safeParse("1000001").success).toBe(false);
        expect(mainlandPostalCodeSchema.safeParse("0999-999").success).toBe(false);
    });
});

describe("sanitizeText", () => {
    it("strips control characters and trims, keeping newlines", () => {
        expect(sanitizeText("  olá\u0000 mundo\u0007\nfim  ")).toBe("olá mundo\nfim");
    });
});

describe("safeNextPath", () => {
    it("keeps same-site relative paths", () => {
        expect(safeNextPath("/conta/encomendas?x=1")).toBe("/conta/encomendas?x=1");
    });

    it.each(["https://evil.example", "//evil.example", "/\\evil", "javascript:alert(1)", "", 42, undefined])(
        "falls back for %s",
        (value) => {
            expect(safeNextPath(value)).toBe("/conta");
        },
    );
});

describe("references", () => {
    it("generates unambiguous references with the right prefix", () => {
        const reference = generateReference("ENC");
        expect(isReference(reference, "ENC")).toBe(true);
        expect(isReference(reference, "RSV")).toBe(false);
        expect(reference).not.toMatch(/[01ILOU]/);
    });

    it("rejects tampered references", () => {
        expect(isReference("ENC-XXXX", "ENC")).toBe(false);
        expect(isReference("ENC-ABCDEFG1", "ENC")).toBe(false);
    });
});
