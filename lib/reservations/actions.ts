"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
    createReservationSchema,
    type ReservationField,
} from "@/lib/reservations/schema";
import { createReservation, ReservationError } from "@/lib/reservations/service";

export type ReservationFormValues = Partial<
    Record<Exclude<ReservationField, "privacyConsent">, string>
>;

export type ReservationFormState = {
    status: "idle" | "error";
    message?: string;
    fieldErrors?: Partial<Record<ReservationField, string>>;
    /** Echoed back so the form keeps the customer's input after an error. */
    values?: ReservationFormValues;
    /** Changes on every submission to remount the form with new defaults. */
    submissionId: number;
};

const formFields = [
    "productId",
    "quantity",
    "name",
    "email",
    "phone",
    "notes",
    "privacyConsent",
    "website",
] as const;

function readForm(formData: FormData) {
    const raw: Record<string, string | undefined> = {};

    for (const field of formFields) {
        const value = formData.get(field);
        raw[field] = typeof value === "string" ? value : undefined;
    }

    return raw;
}

export async function createReservationAction(
    previousState: ReservationFormState,
    formData: FormData,
): Promise<ReservationFormState> {
    const raw = readForm(formData);
    const submissionId = previousState.submissionId + 1;
    const values: ReservationFormValues = {
        productId: raw.productId,
        quantity: raw.quantity,
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        notes: raw.notes,
    };

    const parsed = createReservationSchema.safeParse(raw);

    if (!parsed.success) {
        const { fieldErrors } = z.flattenError(parsed.error);
        const firstErrors = Object.fromEntries(
            Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
        ) as ReservationFormState["fieldErrors"];

        return {
            status: "error",
            message: "Verifique os campos assinalados.",
            fieldErrors: firstErrors,
            values,
            submissionId,
        };
    }

    let reference: string;

    try {
        ({ reference } = await createReservation(parsed.data));
    } catch (error) {
        if (error instanceof ReservationError) {
            return { status: "error", message: error.message, values, submissionId };
        }

        console.error("[reservations] Failed to create reservation", error);

        return {
            status: "error",
            message: "Não foi possível registar a reserva. Tente novamente dentro de instantes.",
            values,
            submissionId,
        };
    }

    redirect(`/reservas/${reference}?nova=1`);
}
