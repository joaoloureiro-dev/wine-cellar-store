"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdmin } from "@/lib/admin/auth";
import { adminOrderTargets, adminTransitionOrder, confirmBankTransfer } from "@/lib/admin/order-operations";
import { revalidateProductPages } from "@/lib/catalog/revalidate";
import { OrderError } from "@/lib/orders/service";
import { isReference } from "@/lib/references";
import { sanitizeText } from "@/lib/validation/fields";

export type AdminActionResult = { ok: boolean; message: string };

const forbidden: AdminActionResult = { ok: false, message: "Sem permissão para esta operação." };

const referenceSchema = z.string().refine((value) => isReference(value, "ENC"));
const noteSchema = z.string().max(500).transform(sanitizeText).optional();

const transitionSchema = z
    .object({ reference: referenceSchema, to: z.enum(adminOrderTargets), note: noteSchema })
    .refine((input) => input.to !== "CANCELLED" || (input.note?.length ?? 0) >= 3, {
        message: "Indique o motivo do cancelamento.",
    });

const successMessages = {
    PROCESSING: "Encomenda em preparação",
    SHIPPED: "Encomenda marcada como enviada",
    DELIVERED: "Encomenda marcada como entregue",
    CANCELLED: "Encomenda cancelada",
} as const;

function revalidateOrder(reference: string) {
    revalidatePath(`/admin/encomendas/${reference}`);
    revalidatePath("/admin", "layout");
    revalidatePath(`/encomendas/${reference}`);
}

function toResult(error: unknown): AdminActionResult {
    if (error instanceof OrderError) {
        return { ok: false, message: error.message };
    }

    throw error;
}

export async function transitionOrderAction(input: {
    reference: string;
    to: string;
    note?: string;
}): Promise<AdminActionResult> {
    const admin = await getAdmin();

    if (!admin) return forbidden;

    const parsed = transitionSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, message: parsed.error.issues[0]?.message ?? "Pedido inválido." };
    }

    try {
        const changedProducts = await adminTransitionOrder(admin, parsed.data);

        if (changedProducts.length > 0) {
            await revalidateProductPages(changedProducts);
        }
    } catch (error) {
        return toResult(error);
    }

    revalidateOrder(parsed.data.reference);

    return { ok: true, message: successMessages[parsed.data.to] };
}

export async function confirmBankTransferAction(input: {
    reference: string;
    note?: string;
}): Promise<AdminActionResult> {
    const admin = await getAdmin();

    if (!admin) return forbidden;

    const parsed = z.object({ reference: referenceSchema, note: noteSchema }).safeParse(input);

    if (!parsed.success) {
        return { ok: false, message: "Pedido inválido." };
    }

    try {
        await confirmBankTransfer(admin, parsed.data);
    } catch (error) {
        return toResult(error);
    }

    revalidateOrder(parsed.data.reference);

    return { ok: true, message: "Pagamento confirmado" };
}
