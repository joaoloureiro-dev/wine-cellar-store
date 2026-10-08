"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdmin } from "@/lib/admin/auth";
import { fieldErrorsFrom, formValues, type AdminFormState } from "@/lib/admin/form-state";
import { addProductImage, deleteImage, moveImage, ProductImageError, updateImageAlt } from "@/lib/admin/product-images";
import { invalidateCatalog } from "@/lib/catalog/cache";
import { createLogger } from "@/lib/logger";
import { MediaStorageError } from "@/lib/media/storage";
import { sanitizeText } from "@/lib/validation/fields";

const logger = createLogger("admin.images");
const id = z.string().regex(/^[a-z0-9-]{1,64}$/i);
const alt = z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, "Descreva a fotografia (mínimo de 3 caracteres).").max(150, "Máximo de 150 caracteres."));

const uploadSchema = z.object({ productId: id, alt });
const imageSchema = z.discriminatedUnion("intent", [
    z.object({ intent: z.literal("alt"), imageId: id, alt }),
    z.object({ intent: z.enum(["up", "down", "delete"]), imageId: id }),
]);

function refresh(productId: string) {
    invalidateCatalog();
    revalidatePath(`/admin/produtos/${productId}`);
}

function failure(error: unknown, submissionId: number): AdminFormState {
    if (error instanceof ProductImageError) {
        return { status: "error", message: error.message, submissionId };
    }

    if (error instanceof MediaStorageError) {
        logger.error("Photo storage failed", { error });
        return { status: "error", message: "Não foi possível guardar a fotografia. Tente novamente.", submissionId };
    }

    throw error;
}

export async function uploadImageAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return { status: "error", message: "Sem permissão para esta operação.", submissionId };

    const values = formValues(formData);
    const parsed = uploadSchema.safeParse(values);
    const file = formData.get("image");

    if (!parsed.success) {
        return { status: "error", message: "Verifique os campos assinalados.", fieldErrors: fieldErrorsFrom(parsed.error), values, submissionId };
    }

    if (!(file instanceof File) || file.size === 0) {
        return { status: "error", message: "Verifique os campos assinalados.", fieldErrors: { image: "Escolha uma fotografia." }, values, submissionId };
    }

    try {
        await addProductImage(admin, { productId: parsed.data.productId, file, alt: parsed.data.alt });
    } catch (error) {
        return { ...failure(error, submissionId), values };
    }

    refresh(parsed.data.productId);
    return { status: "success", message: "Fotografia adicionada", submissionId };
}

export async function imageAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return { status: "error", message: "Sem permissão para esta operação.", submissionId };

    const values = formValues(formData);
    const parsed = imageSchema.safeParse(values);

    if (!parsed.success) {
        return { status: "error", message: "Verifique os campos assinalados.", fieldErrors: fieldErrorsFrom(parsed.error), values, submissionId };
    }

    const input = parsed.data;
    let productId: string | null;

    try {
        productId =
            input.intent === "alt"
                ? await updateImageAlt(admin, { imageId: input.imageId, alt: input.alt })
                : input.intent === "delete"
                  ? await deleteImage(admin, { imageId: input.imageId })
                  : await moveImage(admin, { imageId: input.imageId, direction: input.intent });
    } catch (error) {
        return failure(error, submissionId);
    }

    if (!productId) return { status: "error", message: "Fotografia não encontrada.", submissionId };

    refresh(productId);

    const messages = { alt: "Descrição guardada", delete: "Fotografia removida", up: "Ordem atualizada", down: "Ordem atualizada" };
    return { status: "success", message: messages[input.intent], submissionId };
}
