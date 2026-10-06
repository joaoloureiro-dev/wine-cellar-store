"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isReference } from "@/lib/references";
import { initiatePayment } from "@/lib/payments/service";

export type RetryPaymentResult = { ok: true } | { ok: false; message: string };

/** Starts a new payment attempt for an order (expired MB WAY, cancelled Klarna…). */
export async function retryPayment(reference: string): Promise<RetryPaymentResult> {
    if (typeof reference !== "string" || !isReference(reference, "ENC")) {
        return { ok: false, message: "Encomenda inválida." };
    }

    const result = await initiatePayment(reference);

    if (!result.ok) {
        return { ok: false, message: result.message };
    }

    if (result.checkoutUrl) {
        redirect(result.checkoutUrl);
    }

    revalidatePath(`/encomendas/${reference}`);

    return { ok: true };
}
