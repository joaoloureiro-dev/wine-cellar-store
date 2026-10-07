"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AddressLimitError, saveAddress } from "@/lib/account/addresses";
import { addressSchema, profileSchema, type AddressField } from "@/lib/account/schema";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export type AddressFormState = {
    status: "idle" | "success" | "error";
    message?: string;
    fieldErrors?: Partial<Record<AddressField, string>>;
    values?: Partial<Record<AddressField, string>>;
    submissionId: number;
};

const addressFields: AddressField[] = [
    "label",
    "recipientName",
    "phone",
    "addressLine1",
    "addressLine2",
    "postalCode",
    "city",
    "isDefault",
];

const notSignedIn = "A sua sessão terminou. Inicie sessão novamente.";

export async function saveAddressAction(
    previousState: AddressFormState,
    formData: FormData,
): Promise<AddressFormState> {
    const submissionId = previousState.submissionId + 1;
    const session = await getSession();

    if (!session) {
        return { status: "error", message: notSignedIn, submissionId };
    }

    const raw = Object.fromEntries(
        addressFields.map((field) => {
            const value = formData.get(field);
            return [field, typeof value === "string" ? value : undefined];
        }),
    );
    const addressId = formData.get("addressId");
    const parsed = addressSchema.safeParse(raw);

    if (!parsed.success) {
        const fieldErrors = z.flattenError(parsed.error).fieldErrors as Partial<Record<AddressField, string[]>>;

        return {
            status: "error",
            message: "Verifique os campos assinalados.",
            fieldErrors: Object.fromEntries(
                Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
            ),
            values: raw as AddressFormState["values"],
            submissionId,
        };
    }

    try {
        const saved = await saveAddress(
            session.user.id,
            parsed.data,
            typeof addressId === "string" && addressId ? addressId : undefined,
        );

        if (!saved) {
            return { status: "error", message: "Morada não encontrada.", submissionId };
        }
    } catch (error) {
        if (error instanceof AddressLimitError) {
            return { status: "error", message: error.message, submissionId };
        }

        throw error;
    }

    revalidatePath("/conta", "layout");

    return { status: "success", message: "Morada guardada", submissionId };
}

export async function deleteAddressAction(addressId: string) {
    const session = await getSession();

    if (!session || typeof addressId !== "string") {
        return { ok: false, message: notSignedIn };
    }

    await db.$transaction(async (tx) => {
        const deleted = await tx.address.findFirst({
            where: { id: addressId, userId: session.user.id },
            select: { isDefault: true },
        });

        if (!deleted) {
            return;
        }

        await tx.address.deleteMany({ where: { id: addressId, userId: session.user.id } });

        // Keep a default address when there are others left.
        if (deleted.isDefault) {
            const next = await tx.address.findFirst({
                where: { userId: session.user.id },
                orderBy: { createdAt: "asc" },
                select: { id: true },
            });

            if (next) {
                await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
            }
        }
    });

    revalidatePath("/conta", "layout");

    return { ok: true, message: "Morada eliminada" };
}

export async function setDefaultAddressAction(addressId: string) {
    const session = await getSession();

    if (!session || typeof addressId !== "string") {
        return { ok: false, message: notSignedIn };
    }

    const updated = await db.$transaction(async (tx) => {
        const owned = await tx.address.findFirst({
            where: { id: addressId, userId: session.user.id },
            select: { id: true },
        });

        if (!owned) {
            return false;
        }

        await tx.address.updateMany({
            where: { userId: session.user.id, isDefault: true },
            data: { isDefault: false },
        });
        await tx.address.update({ where: { id: owned.id }, data: { isDefault: true } });

        return true;
    });

    revalidatePath("/conta", "layout");

    return updated
        ? { ok: true, message: "Morada principal atualizada" }
        : { ok: false, message: "Morada não encontrada." };
}

export type ProfileFormState = {
    status: "idle" | "success" | "error";
    message?: string;
    fieldError?: string;
    submissionId: number;
};

export async function updateProfileAction(
    previousState: ProfileFormState,
    formData: FormData,
): Promise<ProfileFormState> {
    const submissionId = previousState.submissionId + 1;
    const session = await getSession();

    if (!session) {
        return { status: "error", message: notSignedIn, submissionId };
    }

    const parsed = profileSchema.safeParse({ name: formData.get("name") });

    if (!parsed.success) {
        return {
            status: "error",
            message: "Verifique o nome.",
            fieldError: parsed.error.issues[0]?.message,
            submissionId,
        };
    }

    await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
    revalidatePath("/conta", "layout");

    return { status: "success", message: "Perfil atualizado", submissionId };
}
