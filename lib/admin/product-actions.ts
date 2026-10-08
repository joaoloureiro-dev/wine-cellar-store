"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdmin } from "@/lib/admin/auth";
import { productUpdateSchema, type ProductField } from "@/lib/admin/product-schema";
import { ProductConflictError, ProductWithoutImagesError, updateProduct } from "@/lib/admin/products";
import { invalidateCatalog } from "@/lib/catalog/cache";

export type ProductFormState = {
    status: "idle" | "success" | "error";
    message?: string;
    fieldErrors?: Partial<Record<ProductField, string>>;
    values?: Partial<Record<ProductField | "version" | "active" | "featured", string>>;
    submissionId: number;
};

const fields = ["productId", "version", "price", "compareAtPrice", "stockQuantity", "availability", "active", "featured"] as const;

export async function saveProductAction(previousState: ProductFormState, formData: FormData): Promise<ProductFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) {
        return { status: "error", message: "Sem permissão para esta operação.", submissionId };
    }

    const raw = Object.fromEntries(
        fields.map((field) => {
            const value = formData.get(field);
            return [field, typeof value === "string" ? value : undefined];
        }),
    );
    const parsed = productUpdateSchema.safeParse(raw);
    const values = raw as ProductFormState["values"];

    if (!parsed.success) {
        const fieldErrors = z.flattenError(parsed.error).fieldErrors as Partial<Record<ProductField, string[]>>;

        return {
            status: "error",
            message: "Verifique os campos assinalados.",
            fieldErrors: Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]])),
            values,
            submissionId,
        };
    }

    try {
        const saved = await updateProduct(admin, parsed.data);

        if (!saved) {
            return { status: "error", message: "Produto não encontrado.", submissionId };
        }
    } catch (error) {
        if (error instanceof ProductConflictError) {
            // Re-render with fresh data from the database.
            revalidatePath(`/admin/produtos/${parsed.data.productId}`);
            return { status: "error", message: error.message, submissionId };
        }

        if (error instanceof ProductWithoutImagesError) {
            return { status: "error", message: error.message, values, submissionId };
        }

        throw error;
    }

    invalidateCatalog();
    revalidatePath("/admin", "layout");

    return { status: "success", message: "Produto atualizado", submissionId };
}
