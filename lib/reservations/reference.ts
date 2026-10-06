import { randomInt } from "node:crypto";

/** Crockford-style alphabet without ambiguous characters (0/O, 1/I/L, U). */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LENGTH = 8;

/**
 * Generates an unguessable public reference such as "RSV-7K3P9QXM"
 * (~39 bits of entropy from a CSPRNG). Uniqueness is enforced by the DB.
 */
export function generateReservationReference() {
    let code = "";

    for (let index = 0; index < LENGTH; index += 1) {
        code += ALPHABET[randomInt(ALPHABET.length)];
    }

    return `RSV-${code}`;
}

export const reservationReferencePattern = /^RSV-[2-9A-HJKMNP-TV-Z]{8}$/;
