"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { textareaClassName } from "@/components/admin/brand-form";
import { useAdminFormFeedback } from "@/components/admin/form-toast";
import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/admin/category-actions";
import { initialAdminFormState } from "@/lib/admin/form-state";

type Category = {
    id: string;
    slug: string;
    name: string;
    description: string;
    position: number;
    seoTitle: string | null;
    seoDescription: string | null;
};

function toValues(category?: Category): Record<string, string> {
    if (!category) return {};

    return {
        name: category.name,
        description: category.description,
        position: String(category.position),
        seoTitle: category.seoTitle ?? "",
        seoDescription: category.seoDescription ?? "",
    };
}

/** Works without JavaScript (plain form posts to the server actions). */
export function CategoryForm({ category, productCount = 0 }: { category?: Category; productCount?: number }) {
    const [state, formAction, isPending] = useActionState(saveCategoryAction, initialAdminFormState);
    const errors = state.fieldErrors ?? {};
    const values = state.status === "error" && state.values ? state.values : toValues(category);

    useAdminFormFeedback(state, { createdHref: (id) => `/admin/categorias/${id}` });

    return (
        <div className="space-y-8">
            <form key={state.status === "success" ? `ok-${state.submissionId}` : "form"} action={formAction} noValidate className="space-y-5">
                {category && <input type="hidden" name="categoryId" value={category.id} />}
                <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
                    <Field label="Nome" name="name" error={errors.name}>
                        <input id="name" name="name" required maxLength={60} defaultValue={values.name} className={inputClassName} {...errorProps("name", errors.name)} />
                    </Field>
                    <Field label="Ordem" name="position" error={errors.position} hint="0 aparece primeiro.">
                        <input id="position" name="position" type="number" inputMode="numeric" min={0} max={999} defaultValue={values.position ?? "0"} className={inputClassName} {...errorProps("position", errors.position)} />
                    </Field>
                </div>
                {category ? (
                    <p className="text-sm text-muted">
                        Endereço: <span className="font-mono text-charcoal">/categorias/{category.slug}</span> (não muda depois de criado)
                    </p>
                ) : (
                    <Field label="Endereço (opcional)" name="slug" error={errors.slug} hint="Gerado a partir do nome se ficar vazio. Não muda depois de criado.">
                        <input id="slug" name="slug" maxLength={60} defaultValue={values.slug} placeholder="ex.: caves-de-servico" className={inputClassName} {...errorProps("slug", errors.slug)} />
                    </Field>
                )}
                <Field label="Descrição" name="description" error={errors.description} hint="Aparece no topo da página da categoria.">
                    <textarea id="description" name="description" required rows={4} maxLength={600} defaultValue={values.description} className={textareaClassName} {...errorProps("description", errors.description)} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Título SEO (opcional)" name="seoTitle" error={errors.seoTitle} hint="Até 70 caracteres. Vazio: o nome da categoria.">
                        <input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={values.seoTitle} className={inputClassName} {...errorProps("seoTitle", errors.seoTitle)} />
                    </Field>
                    <Field label="Descrição SEO (opcional)" name="seoDescription" error={errors.seoDescription} hint="Até 160 caracteres. Vazio: a descrição.">
                        <input id="seoDescription" name="seoDescription" maxLength={160} defaultValue={values.seoDescription} className={inputClassName} {...errorProps("seoDescription", errors.seoDescription)} />
                    </Field>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wine px-5 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
                >
                    {isPending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {category ? "Guardar categoria" : "Criar categoria"}
                </button>
            </form>

            {category && (
                <form action={deleteCategoryAction} className="border-t border-border pt-5">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <p className="mb-3 text-sm text-muted">
                        {productCount > 0
                            ? `Os ${productCount} produtos desta categoria continuam na loja, sem ela. A página /categorias/${category.slug} deixa de existir.`
                            : `A página /categorias/${category.slug} deixa de existir.`}
                    </p>
                    <button
                        type="submit"
                        onClick={(event) => {
                            if (!window.confirm(`Eliminar a categoria "${category.name}"?`)) event.preventDefault();
                        }}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-danger px-6 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                    >
                        <Trash2 size={16} aria-hidden="true" /> Eliminar categoria
                    </button>
                </form>
            )}
        </div>
    );
}
