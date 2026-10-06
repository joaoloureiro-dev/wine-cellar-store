import { z } from "zod";

import {
    emailSchema,
    nameSchema,
    optionalText,
    phoneSchema,
} from "@/lib/validation/fields";

export const MAX_RESERVATION_QUANTITY = 5;

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
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    notes: optionalText(500, "As notas não podem exceder 500 caracteres."),
    privacyConsent: z.literal("on", {
        error: "Tem de autorizar o uso dos seus dados para gerir a reserva.",
    }),
    /** Honeypot: real users never see or fill this field. */
    website: z.string().max(0).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export type ReservationField = Exclude<keyof CreateReservationInput, "website">;
