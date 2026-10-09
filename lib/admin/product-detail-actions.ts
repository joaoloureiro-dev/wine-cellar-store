"use server";

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { getAdmin } from "@/lib/admin/auth";
import { uniqueViolationField } from "@/lib/admin/unique-violation";
import { fieldErrorsFrom, formValues, type AdminFormState } from "@/lib/admin/form-state";
import { productCreateSchema, productDetailsSchema } from "@/lib/admin/product-details-schema";
import { createProduct, ProductConflictError, updateProductDetails } from "@/lib/admin/products";
import { invalidateCategories } from "@/lib/catalog/cache";

const uniqueMessages: Record<string, string> = {
    slug: "Já existe um produto com este endereço.",
    sku: "Já existe um produto com este SKU.",
    ean: "Já existe um produto com este EAN.",
};

/** Form values, with the checked category boxes joined into one field. */
function withCategories(formData: FormData) {
    const categoryIds = formData.getAll("categoryIds").filter((value): value is string => typeof value === "string");
    return { ...formValues(formData), categoryIds: categoryIds.join(",") };
}

function invalidResult(values: Record<string, string>, submissionId: number, fieldErrors: Record<string, string>): AdminFormState {
    return { status: "error", message: "Verifique os campos assinalados.", fieldErrors, values, submissionId };
}

/** Maps database constraint errors to field messages; rethrows the rest. */
function constraintResult(error: unknown, values: Record<string, string>, submissionId: number) {
    const field = uniqueViolationField(error);

    if (field) {
        return invalidResult(values, submissionId, { [field]: uniqueMessages[field] ?? "Valor já utilizado." });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return invalidResult(values, submissionId, { brandId: "Marca não encontrada." });
    }

    throw error;
}

export async function createProductAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return { status: "error", message: "Sem permissão para esta operação.", submissionId };

    const values = withCategories(formData);
    const parsed = productCreateSchema.safeParse(values);

    if (!parsed.success) return invalidResult(values, submissionId, fieldErrorsFrom(parsed.error));

    try {
        const product = await createProduct(admin, parsed.data);
        revalidatePath("/admin/produtos");

        // Created hidden: nothing public changes until it is published.
        return { status: "success", message: "Produto criado (oculto até o publicar)", createdId: product.id, submissionId };
    } catch (error) {
        return constraintResult(error, values, submissionId);
    }
}

export async function saveProductDetailsAction(previousState: AdminFormState, formData: FormData): Promise<AdminFormState> {
    const submissionId = previousState.submissionId + 1;
    const admin = await getAdmin();

    if (!admin) return { status: "error", message: "Sem permissão para esta operação.", submissionId };

    const values = withCategories(formData);
    const parsed = productDetailsSchema.safeParse(values);

    if (!parsed.success) return invalidResult(values, submissionId, fieldErrorsFrom(parsed.error));

    try {
        if (!(await updateProductDetails(admin, parsed.data))) {
            return { status: "error", message: "Produto não encontrado.", submissionId };
        }
    } catch (error) {
        if (error instanceof ProductConflictError) {
            revalidatePath(`/admin/produtos/${parsed.data.productId}`);
            return { status: "error", message: error.message, submissionId };
        }

        return constraintResult(error, values, submissionId);
    }

    // Product pages and category pages (and their counts) change.
    invalidateCategories();
    revalidatePath(`/admin/produtos/${parsed.data.productId}`);

    return { status: "success", message: "Detalhes guardados", submissionId };
}
