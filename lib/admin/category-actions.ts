"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/admin/auth";
import { createCategory, deleteCategory, updateCategory } from "@/lib/admin/categories";
import { categorySchema } from "@/lib/admin/category-schema";
import { fieldErrorsFrom, formValues, type AdminFormState } from "@/lib/admin/form-state";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { invalidateCategories } from "@/lib/catalog/cache";

const uniqueMessages: Record<string, string> = {
    slug: "Já existe uma categoria com este endereço.",
    name: "Já existe uma categoria com este nome.",
};

export async function saveCategoryAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return { status: "error", message: "Sem permissão para esta operação.", submissionId };

    const values = formValues(formData);
    const categoryId = values.categoryId || undefined;
    const parsed = categorySchema.safeParse(values);

    if (!parsed.success) {
        return { status: "error", message: "Verifique os campos assinalados.", fieldErrors: fieldErrorsFrom(parsed.error), values, submissionId };
    }

    let createdId: string | undefined;

    try {
        if (categoryId) {
            if (!(await updateCategory(admin, categoryId, parsed.data))) {
                return { status: "error", message: "Categoria não encontrada.", submissionId };
            }
        } else {
            createdId = (await createCategory(admin, parsed.data)).id;
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

    invalidateCategories();
    revalidatePath("/admin/categorias");

    return { status: "success", message: categoryId ? "Categoria atualizada" : "Categoria criada", createdId, submissionId };
}

export async function deleteCategoryAction(formData: FormData) {
    const admin = await getAdmin();
    const id = formData.get("categoryId");

    if (!admin || typeof id !== "string") return;

    await deleteCategory(admin, id);
    invalidateCategories();
    revalidatePath("/admin/categorias");
    redirect("/admin/categorias");
}
