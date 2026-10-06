import { z } from "zod";

export const MAX_RESERVATION_QUANTITY = 5;

/** Strips control characters (except newlines/tabs) and trims. */
function sanitizeText(value: string) {
    return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
}

const text = (min: number, max: number, messages: { min: string; max: string }) =>
    z
        .string()
        .transform(sanitizeText)
        .pipe(z.string().min(min, messages.min).max(max, messages.max));

/**
 * Server-side validation of the public reservation form. Every value comes
 * from an untrusted FormData and is normalised here before reaching the DB.
 */
export const createReservationSchema = z.object({
    productId: z.string().regex(/^[a-z0-9-]{1,64}$/i, "Produto inválido."),
    quantity: z.coerce
        .number({ error: "Quantidade inválida." })
        .int("Quantidade inválida.")
        .min(1, "Quantidade inválida.")
        .max(MAX_RESERVATION_QUANTITY, `Máximo de ${MAX_RESERVATION_QUANTITY} unidades por reserva.`),
    name: text(2, 100, {
        min: "Indique o seu nome.",
        max: "O nome é demasiado longo.",
    }),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .max(254, "Email demasiado longo.")
        .pipe(z.email("Indique um email válido.")),
    phone: z
        .string()
        .transform((value) => value.replace(/[\s().-]/g, ""))
        .pipe(
            z
                .string()
                .regex(/^\+?[0-9]{9,15}$/, "Indique um telefone válido (ex.: 912 345 678)."),
        ),
    notes: text(0, 500, { min: "", max: "As notas não podem exceder 500 caracteres." })
        .optional()
        .transform((value) => value || undefined),
    privacyConsent: z.literal("on", {
        error: "Tem de autorizar o uso dos seus dados para gerir a reserva.",
    }),
    /** Honeypot: real users never see or fill this field. */
    website: z.string().max(0).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export type ReservationField = Exclude<keyof CreateReservationInput, "website">;
