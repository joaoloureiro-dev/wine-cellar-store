import { z } from "zod";

import {
    mainlandPostalCodeSchema,
    nameSchema,
    optionalText,
    phoneSchema,
    text,
} from "@/lib/validation/fields";

export const MAX_ADDRESSES = 10;

export const addressSchema = z.object({
    label: optionalText(40, "O nome da morada é demasiado longo."),
    recipientName: nameSchema,
    phone: phoneSchema,
    addressLine1: text(5, 120, {
        min: "Indique a morada.",
        max: "A morada é demasiado longa.",
    }),
    addressLine2: optionalText(120, "Este campo é demasiado longo."),
    postalCode: mainlandPostalCodeSchema,
    city: text(2, 60, {
        min: "Indique a localidade.",
        max: "A localidade é demasiado longa.",
    }),
    isDefault: z
        .literal("on")
        .optional()
        .transform((value) => value === "on"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressField = keyof AddressInput;

export const profileSchema = z.object({ name: nameSchema });
