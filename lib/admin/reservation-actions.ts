"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdmin } from "@/lib/admin/auth";
import type { AdminActionResult } from "@/lib/admin/order-actions";
import {
    adminReservationTargets,
    adminTransitionReservation,
    updateReservationNotes,
} from "@/lib/admin/reservation-operations";
import { revalidateProductPages } from "@/lib/catalog/revalidate";
import { isReference } from "@/lib/references";
import { ReservationError } from "@/lib/reservations/service";
import { sanitizeText } from "@/lib/validation/fields";

const forbidden: AdminActionResult = { ok: false, message: "Sem permissão para esta operação." };

const referenceSchema = z.string().refine((value) => isReference(value, "RSV"));

const transitionSchema = z
    .object({
        reference: referenceSchema,
        to: z.enum(adminReservationTargets),
        note: z.string().max(500).transform(sanitizeText).optional(),
        holdDays: z.coerce.number().int().min(1, "Prazo entre 1 e 30 dias.").max(30, "Prazo entre 1 e 30 dias.").optional(),
    })
    .refine((input) => input.to !== "CANCELLED" || (input.note?.length ?? 0) >= 3, {
        message: "Indique o motivo do cancelamento.",
    })
    .refine((input) => input.to !== "CONFIRMED" || input.holdDays !== undefined, {
        message: "Indique o prazo da reserva.",
    });

function revalidateReservation(reference: string) {
    revalidatePath(`/admin/reservas/${reference}`);
    revalidatePath("/admin", "layout");
    revalidatePath(`/reservas/${reference}`);
}

function toResult(error: unknown): AdminActionResult {
    if (error instanceof ReservationError) {
        return { ok: false, message: error.message };
    }

    throw error;
}

export async function transitionReservationAction(input: {
    reference: string;
    to: string;
    note?: string;
    holdDays?: number | string;
}): Promise<AdminActionResult> {
    const admin = await getAdmin();

    if (!admin) return forbidden;

    const parsed = transitionSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, message: parsed.error.issues[0]?.message ?? "Pedido inválido." };
    }

    let message: string;

    try {
        const result = await adminTransitionReservation(admin, parsed.data);

        if (result.stockChanged) {
            await revalidateProductPages([result.productId]);
        }

        message = {
            CONFIRMED: result.stockHeld ? "Reserva confirmada e stock reservado" : "Reserva confirmada (sem stock disponível para reservar)",
            AWAITING_PAYMENT: "Reserva a aguardar pagamento",
            PAID: "Reserva marcada como paga",
            CANCELLED: "Reserva cancelada",
        }[parsed.data.to];
    } catch (error) {
        return toResult(error);
    }

    revalidateReservation(parsed.data.reference);

    return { ok: true, message };
}

export async function saveReservationNotesAction(input: { reference: string; notes: string }): Promise<AdminActionResult> {
    const admin = await getAdmin();

    if (!admin) return forbidden;

    const parsed = z
        .object({ reference: referenceSchema, notes: z.string().max(2000, "Máximo de 2000 caracteres.").transform(sanitizeText) })
        .safeParse(input);

    if (!parsed.success) {
        return { ok: false, message: parsed.error.issues[0]?.message ?? "Pedido inválido." };
    }

    try {
        await updateReservationNotes(admin, parsed.data);
    } catch (error) {
        return toResult(error);
    }

    revalidatePath(`/admin/reservas/${parsed.data.reference}`);

    return { ok: true, message: "Notas guardadas" };
}
