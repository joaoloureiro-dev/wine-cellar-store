"use server";

import { revalidatePath } from "next/cache";

import { getAdmin } from "@/lib/admin/auth";
import { brandSchema } from "@/lib/admin/brand-schema";
import { createBrand, updateBrand } from "@/lib/admin/brands";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { fieldErrorsFrom, formValues, type AdminFormState } from "@/lib/admin/form-state";
import { invalidateBrands, invalidateCatalog } from "@/lib/catalog/cache";

const forbidden = (submissionId: number): AdminFormState => ({
    status: "error",
    message: "Sem permissão para esta operação.",
    submissionId,
});

const uniqueMessages: Record<string, string> = {
    slug: "Já existe uma marca com este endereço.",
    name: "Já existe uma marca com este nome.",
};

export async function saveBrandAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return forbidden(submissionId);

    const values = formValues(formData);
    const brandId = values.brandId || undefined;
    const parsed = brandSchema.safeParse(values);

    if (!parsed.success) {
        return { status: "error", message: "Verifique os campos assinalados.", fieldErrors: fieldErrorsFrom(parsed.error), values, submissionId };
    }

    let createdId: string | undefined;

    try {
        if (brandId) {
            if (!(await updateBrand(admin, brandId, parsed.data))) {
                return { status: "error", message: "Marca não encontrada.", submissionId };
            }
        } else {
            createdId = (await createBrand(admin, parsed.data)).id;
        }
    } catch (error) {
        const field = uniqueViolationField(error);

        if (field) {
            return {
                status: "error",
                message: "Verifique os campos assinalados.",
                fieldErrors: { [field]: uniqueMessages[field] ?? "Valor já utilizado." },
                values,
                submissionId,
            };
        }

        throw error;
    }

    invalidateBrands();
    // Brand names appear on product cards and pages too.
    invalidateCatalog();
    revalidatePath("/admin/marcas");

    return { status: "success", message: brandId ? "Marca atualizada" : "Marca criada", createdId, submissionId };
}
