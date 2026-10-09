"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect } from "react";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { saveProductAction, type ProductFormState } from "@/lib/admin/product-actions";

const initialState: ProductFormState = { status: "idle", submissionId: 0 };

const centsToInput = (cents: number | null) =>
    cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");

type ProductFormProps = {
    product: {
        id: string;
        priceCents: number;
        compareAtPriceCents: number | null;
        stockQuantity: number;
        stockStatus: string;
        active: boolean;
        featured: boolean;
        version: number;
    };
};

/** Works without JavaScript (plain form post to the server action). */
export function ProductForm({ product }: ProductFormProps) {
    const [state, formAction, isPending] = useActionState(saveProductAction, initialState);
    const toast = useToast();
    const errors = state.fieldErrors ?? {};

    // Keep what the admin typed after a validation error; after a save or a
    // conflict the page re-renders with a new version and fresh values.
    const typed = state.status === "error" && state.values?.version === String(product.version) ? state.values : null;
    const values = {
        price: typed?.price ?? centsToInput(product.priceCents),
        compareAtPrice: typed?.compareAtPrice ?? centsToInput(product.compareAtPriceCents),
        stockQuantity: typed?.stockQuantity ?? String(product.stockQuantity),
        availability: typed?.availability ?? (product.stockStatus === "PREORDER" ? "PREORDER" : "auto"),
        active: typed ? typed.active === "on" : product.active,
        featured: typed ? typed.featured === "on" : product.featured,
    };

    useEffect(() => {
        if (state.submissionId === 0) return;

        if (state.status === "success") {
            toast.success(state.message ?? "Produto atualizado");
        } else if (state.message) {
            toast.error("Não foi possível guardar", { description: state.message });
        }
        // Only react to new submissions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submissionId]);

    return (
        <form key={`${product.version}-${typed ? state.submissionId : 0}`} action={formAction} noValidate className="space-y-6">
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="version" value={product.version} />

            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-charcoal">Preço</legend>
                <Field label="Preço (€)" name="price" error={errors.price}>
                    <input id="price" name="price" inputMode="decimal" required defaultValue={values.price} className={inputClassName} {...errorProps("price", errors.price)} />
                </Field>
                <Field label="Preço anterior (€, opcional)" name="compareAtPrice" error={errors.compareAtPrice} hint="Mostrado riscado quando há promoção.">
                    <input id="compareAtPrice" name="compareAtPrice" inputMode="decimal" defaultValue={values.compareAtPrice} className={inputClassName} {...errorProps("compareAtPrice", errors.compareAtPrice)} />
                </Field>
            </fieldset>

            <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-3 text-sm font-semibold text-charcoal">Stock</legend>
                <Field label="Unidades em armazém" name="stockQuantity" error={errors.stockQuantity} hint="Já descontadas as encomendas por pagar e reservas confirmadas.">
                    <input id="stockQuantity" name="stockQuantity" type="number" inputMode="numeric" min={0} max={9999} required defaultValue={values.stockQuantity} className={inputClassName} {...errorProps("stockQuantity", errors.stockQuantity)} />
                </Field>
                <Field label="Disponibilidade" name="availability" error={errors.availability}>
                    <select id="availability" name="availability" defaultValue={values.availability} className={inputClassName}>
                        <option value="auto">Automática (pelo stock)</option>
                        <option value="PREORDER">Disponível para reserva</option>
                    </select>
                </Field>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-semibold text-charcoal">Visibilidade</legend>
                <label className="flex items-start gap-3 text-sm text-charcoal">
                    <input type="checkbox" name="active" defaultChecked={values.active} className="mt-0.5 size-4 accent-wine" />
                    <span>
                        Visível na loja
                        <span className="block text-xs text-muted">Produtos ocultos não aparecem no catálogo nem podem ser comprados.</span>
                    </span>
                </label>
                <label className="flex items-start gap-3 text-sm text-charcoal">
                    <input type="checkbox" name="featured" defaultChecked={values.featured} className="mt-0.5 size-4 accent-wine" />
                    <span>Destacar na página inicial</span>
                </label>
            </fieldset>

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-wine px-5 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                Guardar alterações
            </button>
        </form>
    );
}
