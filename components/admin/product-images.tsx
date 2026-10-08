"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { useAdminFormFeedback } from "@/components/admin/form-toast";
import { useToast } from "@/components/ui/toast";
import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { initialAdminFormState } from "@/lib/admin/form-state";
import { imageAction, uploadImageAction } from "@/lib/admin/product-image-actions";

type ProductImage = { id: string; url: string; alt: string | null };

const iconButtonClass =
    "inline-flex size-10 items-center justify-center rounded-md border border-border text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-40";

type RowProps = {
    image: ProductImage;
    index: number;
    count: number;
    formAction: (formData: FormData) => void;
    isPending: boolean;
    altError?: string;
};

function ImageRow({ image, index, count, formAction, isPending, altError }: RowProps) {
    const altId = `alt-${image.id}`;

    return (
        <li>
            <form action={formAction} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto]">
                <input type="hidden" name="imageId" value={image.id} />
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted">
                    <Image src={image.url} alt={image.alt ?? ""} fill sizes="96px" className="object-contain" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">{index === 0 ? "Fotografia principal" : `Fotografia ${index + 1}`}</p>
                    <label htmlFor={altId} className="sr-only">
                        Descrição da fotografia {index + 1}
                    </label>
                    <div className="mt-1.5 flex gap-2">
                        <input
                            key={image.alt}
                            id={altId}
                            name="alt"
                            maxLength={150}
                            defaultValue={image.alt ?? ""}
                            placeholder="Descrição (texto alternativo)"
                            className={`${inputClassName} mt-0`}
                            {...errorProps(altId, altError)}
                        />
                        <button type="submit" name="intent" value="alt" disabled={isPending} className="shrink-0 rounded-md border border-border px-3 text-sm font-semibold text-charcoal hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-wine">
                            Guardar
                        </button>
                    </div>
                    {altError && (
                        <p id={`${altId}-error`} className="mt-1 text-xs text-danger">
                            {altError}
                        </p>
                    )}
                </div>
                <div className="col-span-2 flex gap-2 sm:col-span-1 sm:self-center">
                    <button type="submit" name="intent" value="up" disabled={isPending || index === 0} aria-label="Mover para cima" className={iconButtonClass}>
                        <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button type="submit" name="intent" value="down" disabled={isPending || index === count - 1} aria-label="Mover para baixo" className={iconButtonClass}>
                        <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                        type="submit"
                        name="intent"
                        value="delete"
                        disabled={isPending}
                        aria-label="Remover fotografia"
                        onClick={(event) => {
                            if (!window.confirm("Remover esta fotografia?")) event.preventDefault();
                        }}
                        className={`${iconButtonClass} text-danger`}
                    >
                        <Trash2 size={16} aria-hidden="true" />
                    </button>
                </div>
            </form>
        </li>
    );
}

/** Same limit as the server (lib/admin/product-images.ts). */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function UploadForm({ productId, productName }: { productId: string; productName: string }) {
    const [state, formAction, isPending] = useActionState(uploadImageAction, initialAdminFormState);
    const errors = state.fieldErrors ?? {};
    const toast = useToast();

    useAdminFormFeedback(state);

    // Larger requests are rejected before the action runs; say why instead.
    const checkSize = (event: React.FormEvent<HTMLFormElement>) => {
        const file = new FormData(event.currentTarget).get("image");

        if (file instanceof File && file.size > MAX_IMAGE_BYTES) {
            event.preventDefault();
            toast.error("Fotografia demasiado grande", { description: "O máximo é 4 MB. Reduza a resolução ou use WebP/AVIF." });
        }
    };

    return (
        <form key={state.status === "success" ? `ok-${state.submissionId}` : "upload"} action={formAction} onSubmit={checkSize} noValidate className="space-y-4 border-t border-border pt-5">
            <input type="hidden" name="productId" value={productId} />
            <Field label="Nova fotografia" name="image" error={errors.image} hint="JPEG, PNG, WebP ou AVIF, até 4 MB. Fundo neutro, de preferência quadrada.">
                <input
                    id="image"
                    name="image"
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className={`${inputClassName} file:mr-3 file:rounded file:border-0 file:bg-surface-muted file:px-3 file:py-1 file:text-sm file:font-semibold`}
                    {...errorProps("image", errors.image)}
                />
            </Field>
            <Field label="Descrição da fotografia" name="alt" error={errors.alt} hint="Para leitores de ecrã e motores de busca, ex.: «vista frontal com a porta fechada».">
                <input id="alt" name="alt" required maxLength={150} defaultValue={state.values?.alt ?? productName} className={inputClassName} {...errorProps("alt", errors.alt)} />
            </Field>
            <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
                Adicionar fotografia
            </button>
        </form>
    );
}

/** Photos of a product: the first is the main one. Works without JavaScript. */
export function ProductImages({ productId, productName, images }: { productId: string; productName: string; images: ProductImage[] }) {
    // One state for all rows: a removed row unmounts, but its feedback still shows.
    const [state, formAction, isPending] = useActionState(imageAction, initialAdminFormState);

    useAdminFormFeedback(state);

    return (
        <div className="space-y-5">
            {images.length > 0 ? (
                <ul role="list" className="space-y-4">
                    {images.map((image, index) => (
                        <ImageRow
                            key={image.id}
                            image={image}
                            index={index}
                            count={images.length}
                            formAction={formAction}
                            isPending={isPending}
                            altError={state.values?.imageId === image.id ? state.fieldErrors?.alt : undefined}
                        />
                    ))}
                </ul>
            ) : (
                <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted">
                    Ainda sem fotografias. Adicione pelo menos uma antes de tornar o produto visível.
                </p>
            )}
            <UploadForm productId={productId} productName={productName} />
        </div>
    );
}
