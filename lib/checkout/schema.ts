import { z } from "zod";

import { paymentMethods } from "@/lib/checkout/payment-methods";
import { shippingMethods } from "@/lib/checkout/shipping";
import {
    emailSchema,
    mainlandPostalCodeSchema,
    nameSchema,
    optionalNifSchema,
    optionalText,
    phoneSchema,
    text,
} from "@/lib/validation/fields";

/**
 * Checkout validation. The same schema validates each step in the browser
 * (for fast feedback) and the whole submission on the server (authoritative).
 */
export const checkoutSchema = z.object({
    idempotencyKey: z.uuid("Sessão de checkout inválida. Atualize a página."),
    // Step 1 — customer
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    taxId: optionalNifSchema,
    // Step 2 — address
    addressLine1: text(5, 120, {
        min: "Indique a morada de entrega.",
        max: "A morada é demasiado longa.",
    }),
    addressLine2: optionalText(120, "Este campo é demasiado longo."),
    postalCode: mainlandPostalCodeSchema,
    city: text(2, 60, {
        min: "Indique a localidade.",
        max: "A localidade é demasiado longa.",
    }),
    // Step 3 — delivery
    shippingMethod: z.enum(shippingMethods.map((method) => method.id), {
        error: "Escolha um método de entrega.",
    }),
    customerNotes: optionalText(500, "As notas não podem exceder 500 caracteres."),
    // Step 4 — payment
    paymentMethod: z.enum(paymentMethods.map((method) => method.id), {
        error: "Escolha um método de pagamento.",
    }),
    // Step 5 — review
    termsAccepted: z.literal("on", {
        error: "Confirme os dados da encomenda para continuar.",
    }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutField = keyof CheckoutInput;

export const checkoutSteps = [
    { id: "customer", label: "Dados", fields: ["name", "email", "phone", "taxId"] },
    { id: "address", label: "Morada", fields: ["addressLine1", "addressLine2", "postalCode", "city"] },
    { id: "delivery", label: "Entrega", fields: ["shippingMethod", "customerNotes"] },
    { id: "payment", label: "Pagamento", fields: ["paymentMethod"] },
    { id: "review", label: "Revisão", fields: ["termsAccepted"] },
] as const satisfies readonly { id: string; label: string; fields: readonly CheckoutField[] }[];

export type CheckoutStepId = (typeof checkoutSteps)[number]["id"];

/** MB WAY only works with Portuguese mobile numbers (9XX XXX XXX). */
export function getMbWayPhoneError(paymentMethod: unknown, phone: unknown) {
    if (paymentMethod !== "MBWAY") {
        return null;
    }

    const normalized = String(phone ?? "").replace(/[\s().-]/g, "");

    return /^(\+?351)?9[0-9]{8}$/.test(normalized)
        ? null
        : "O MB WAY requer um telemóvel português (9XX XXX XXX). Corrija o telefone nos seus dados ou escolha outro método.";
}
