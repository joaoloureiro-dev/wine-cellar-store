"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { readCartLines, writeCartLines } from "@/lib/cart/storage";
import { revalidateProductPages } from "@/lib/catalog/revalidate";
import {
    checkoutSchema,
    checkoutSteps,
    type CheckoutField,
    type CheckoutStepId,
} from "@/lib/checkout/schema";
import { OrderError, placeOrder } from "@/lib/orders/service";

export type CheckoutFormValues = Partial<Record<Exclude<CheckoutField, "termsAccepted">, string>>;

export type CheckoutFormState = {
    status: "idle" | "error";
    message?: string;
    fieldErrors?: Partial<Record<CheckoutField, string>>;
    /** Step to show after an error (the first step with an invalid field). */
    step?: CheckoutStepId;
    /** Echoed back so the form keeps the customer's input after an error. */
    values?: CheckoutFormValues;
    /** Link to show next to the message (e.g. back to the cart). */
    actionHref?: string;
    submissionId: number;
};

const fields = Object.keys(checkoutSchema.shape) as CheckoutField[];

function readForm(formData: FormData) {
    const raw: Record<string, string | undefined> = {};

    for (const field of fields) {
        const value = formData.get(field);
        raw[field] = typeof value === "string" ? value : undefined;
    }

    return raw;
}

function firstStepWithError(fieldErrors: Partial<Record<CheckoutField, string>>) {
    return checkoutSteps.find((step) =>
        step.fields.some((field) => fieldErrors[field as CheckoutField]),
    )?.id;
}

export async function placeOrderAction(
    previousState: CheckoutFormState,
    formData: FormData,
): Promise<CheckoutFormState> {
    const raw = readForm(formData);
    const submissionId = previousState.submissionId + 1;
    const values: CheckoutFormValues = Object.fromEntries(
        Object.entries(raw).filter(([field]) => field !== "termsAccepted"),
    );

    const parsed = checkoutSchema.safeParse(raw);

    if (!parsed.success) {
        const flattened = z.flattenError(parsed.error).fieldErrors as Partial<
            Record<CheckoutField, string[]>
        >;
        const fieldErrors = Object.fromEntries(
            Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]]),
        ) as Partial<Record<CheckoutField, string>>;

        return {
            status: "error",
            message: "Verifique os campos assinalados.",
            fieldErrors,
            step: firstStepWithError(fieldErrors),
            values,
            submissionId,
        };
    }

    let reference: string;

    try {
        const lines = await readCartLines();
        ({ reference } = await placeOrder(parsed.data, lines));
        // Stock is now held by the order: the cart has served its purpose.
        await writeCartLines([]);
        await revalidateProductPages(lines.map((line) => line.productId));
    } catch (error) {
        if (error instanceof OrderError) {
            return {
                status: "error",
                message: error.message,
                step: "review",
                values,
                actionHref:
                    error.code === "INSUFFICIENT_STOCK" || error.code === "EMPTY_CART"
                        ? "/carrinho"
                        : undefined,
                submissionId,
            };
        }

        console.error("[checkout] Failed to place order", error);

        return {
            status: "error",
            message:
                "Não foi possível concluir a encomenda. Nenhum valor foi cobrado. Tente novamente dentro de instantes.",
            step: "review",
            values,
            submissionId,
        };
    }

    redirect(`/encomendas/${reference}?nova=1`);
}
