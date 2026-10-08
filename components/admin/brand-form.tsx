"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { useAdminFormFeedback } from "@/components/admin/form-toast";
import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { saveBrandAction } from "@/lib/admin/brand-actions";
import { initialAdminFormState } from "@/lib/admin/form-state";

type Brand = { id: string; slug: string; name: string; country: string; description: string };

export const textareaClassName =
    "mt-1.5 block w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-charcoal transition-colors focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30 aria-invalid:border-danger";

export function BrandForm({ brand }: { brand?: Brand }) {
    const [state, formAction, isPending] = useActionState(saveBrandAction, initialAdminFormState);
    const errors = state.fieldErrors ?? {};
    const values = state.status === "error" && state.values ? state.values : (brand ?? {});

    useAdminFormFeedback(state, { createdHref: (id) => `/admin/marcas/${id}` });

    return (
        <form key={state.status === "success" ? `ok-${state.submissionId}` : "form"} action={formAction} noValidate className="space-y-5">
            {brand && <input type="hidden" name="brandId" value={brand.id} />}
            <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nome" name="name" error={errors.name}>
                    <input id="name" name="name" required maxLength={80} defaultValue={values.name} className={inputClassName} {...errorProps("name", errors.name)} />
                </Field>
                <Field label="País" name="country" error={errors.country}>
                    <input id="country" name="country" required maxLength={60} defaultValue={values.country} className={inputClassName} {...errorProps("country", errors.country)} />
                </Field>
            </div>
            {brand ? (
                <p className="text-sm text-muted">
                    Endereço: <span className="font-mono text-charcoal">/marcas/{brand.slug}</span> (não muda depois de criado)
                </p>
            ) : (
                <Field label="Endereço (opcional)" name="slug" error={errors.slug} hint="Gerado a partir do nome se ficar vazio. Não muda depois de criado.">
                    <input id="slug" name="slug" maxLength={60} defaultValue={values.slug} placeholder="ex.: la-sommeliere" className={inputClassName} {...errorProps("slug", errors.slug)} />
                </Field>
            )}
            <Field label="Descrição" name="description" error={errors.description}>
                <textarea id="description" name="description" required rows={4} maxLength={600} defaultValue={values.description} className={textareaClassName} {...errorProps("description", errors.description)} />
            </Field>
            <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {brand ? "Guardar marca" : "Criar marca"}
            </button>
        </form>
    );
}
