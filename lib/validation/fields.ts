import { z } from "zod";

/**
 * Shared field validators for public forms. All inputs are untrusted and
 * normalised here before reaching business logic or the database.
 */

/** Strips control characters (except newlines/tabs) and trims. */
export function sanitizeText(value: string) {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export const text = (min: number, max: number, messages: { min: string; max: string }) =>
    z
        .string()
        .transform(sanitizeText)
        .pipe(z.string().min(min, messages.min).max(max, messages.max));

export const optionalText = (max: number, message: string) =>
    text(0, max, { min: "", max: message })
        .optional()
        .transform((value) => value || undefined);

export const nameSchema = text(2, 100, {
    min: "Indique o seu nome.",
    max: "O nome é demasiado longo.",
});

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email demasiado longo.")
    .pipe(z.email("Indique um email válido."));

export const phoneSchema = z
    .string()
    .transform((value) => value.replace(/[\s().-]/g, ""))
    .pipe(
        z.string().regex(/^\+?[0-9]{9,15}$/, "Indique um telefone válido (ex.: 912 345 678)."),
    );

/** Portuguese NIF: 9 digits with a mod-11 check digit. */
export function isValidNif(value: string) {
    if (!/^[0-9]{9}$/.test(value)) {
        return false;
    }

    const digits = value.split("").map(Number);
    const sum = digits.slice(0, 8).reduce((total, digit, index) => total + digit * (9 - index), 0);
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? 0 : 11 - remainder;

    return checkDigit === digits[8];
}

export const optionalNifSchema = z
    .string()
    .transform((value) => value.replace(/\s/g, ""))
    .refine((value) => value === "" || isValidNif(value), "Indique um NIF válido.")
    .optional()
    .transform((value) => value || undefined);

/** Mainland Portugal postal code (1000-000 to 8999-999). */
export const mainlandPostalCodeSchema = z
    .string()
    .trim()
    .regex(/^[0-9]{4}-[0-9]{3}$/, "Indique o código postal no formato 0000-000.")
    .refine(
        (value) => Number(value.slice(0, 4)) >= 1000 && Number(value.slice(0, 4)) < 9000,
        "De momento só entregamos em Portugal Continental.",
    );
