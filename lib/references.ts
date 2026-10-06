import { randomInt } from "node:crypto";

/** Crockford-style alphabet without ambiguous characters (0/O, 1/I/L, U). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LENGTH = 8;

/**
 * Unguessable public reference such as "RSV-7K3P9QXM" (~39 bits of entropy
 * from a CSPRNG). Uniqueness is enforced by a database unique index.
 */
export function generateReference(prefix: "RSV" | "ENC") {
    let code = "";

    for (let index = 0; index < LENGTH; index += 1) {
        code += ALPHABET[randomInt(ALPHABET.length)];
    }

    return `${prefix}-${code}`;
}

export function isReference(value: string, prefix: "RSV" | "ENC") {
    return new RegExp(`^${prefix}-[2-9A-HJKMNP-TV-Z]{${LENGTH}}$`).test(value);
}
