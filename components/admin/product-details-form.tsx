"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { textareaClassName } from "@/components/admin/brand-form";
import { useAdminFormFeedback } from "@/components/admin/form-toast";
import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { initialAdminFormState } from "@/lib/admin/form-state";
import { createProductAction, saveProductDetailsAction } from "@/lib/admin/product-detail-actions";

type Zone = { position: number; minCelsius: number; maxCelsius: number };

export type ProductDetails = {
    id: string;
    slug: string;
    name: string;
    brandId: string;
    sku: string;
    ean: string | null;
    shortDescription: string;
    description: string;
    capacity: number;
    zones: number;
    installationType: string;
    widthMm: number;
    heightMm: number;
    depthMm: number;
    weightGrams: number | null;
    energyClass: string | null;
    annualEnergyKwh: number | null;
    noiseDb: number | null;
    reversibleDoor: boolean | null;
    uvProtectedGlass: boolean | null;
    ledLighting: boolean | null;
    lock: boolean | null;
    seoTitle: string | null;
    seoDescription: string | null;
    version: number;
    temperatureZones: Zone[];
    categoryIds: string[];
};

type Props = {
    brands: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    product?: ProductDetails;
};

const decimal = (value: number) => String(value).replace(".", ",");
const optional = (value: number | null, scale = 1) => (value === null ? "" : decimal(value / scale));
const feature = (value: boolean | null) => (value === null ? "" : value ? "yes" : "no");

/** Form values for an existing product, as the admin would type them. */
function productValues(product: ProductDetails): Record<string, string> {
    const values: Record<string, string> = {
        name: product.name,
        brandId: product.brandId,
        categoryIds: product.categoryIds.join(","),
        sku: product.sku,
        ean: product.ean ?? "",
        shortDescription: product.shortDescription,
        description: product.description,
        capacity: String(product.capacity),
        zones: String(product.zones),
        installationType: product.installationType,
        widthCm: decimal(product.widthMm / 10),
        heightCm: decimal(product.heightMm / 10),
        depthCm: decimal(product.depthMm / 10),
        weightKg: optional(product.weightGrams, 1000),
        energyClass: product.energyClass ?? "",
        annualEnergyKwh: optional(product.annualEnergyKwh),
        noiseDb: optional(product.noiseDb),
        reversibleDoor: feature(product.reversibleDoor),
        uvProtectedGlass: feature(product.uvProtectedGlass),
        ledLighting: feature(product.ledLighting),
        lock: feature(product.lock),
        seoTitle: product.seoTitle ?? "",
        seoDescription: product.seoDescription ?? "",
    };

    for (const zone of product.temperatureZones) {
        values[`zone${zone.position}Min`] = String(zone.minCelsius);
        values[`zone${zone.position}Max`] = String(zone.maxCelsius);
    }

    return values;
}

const featureFields = [
    ["reversibleDoor", "Porta reversível"],
    ["uvProtectedGlass", "Vidro com proteção UV"],
    ["ledLighting", "Iluminação LED"],
    ["lock", "Fechadura"],
] as const;

const legendClass = "mb-3 text-sm font-semibold text-charcoal";

/** Creates a product, or edits its content and specifications. Works without JavaScript. */
export function ProductDetailsForm({ brands, categories, product }: Props) {
    const [state, formAction, isPending] = useActionState(product ? saveProductDetailsAction : createProductAction, initialAdminFormState);
    const errors = state.fieldErrors ?? {};

    useAdminFormFeedback(state, { createdHref: (id) => `/admin/produtos/${id}` });

    // Keep what the admin typed after a validation error; after a save or a
    // conflict the page re-renders with a new version and fresh values.
    const typed = state.status === "error" && state.values && (!product || state.values.version === String(product.version)) ? state.values : null;
    const values = typed ?? (product ? productValues(product) : {});

    const input = (name: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
        <input id={name} name={name} defaultValue={values[name]} className={inputClassName} {...props} {...errorProps(name, errors[name])} />
    );

    return (
        <form key={`${product?.version ?? "new"}-${typed ? state.submissionId : 0}`} action={formAction} noValidate className="space-y-8">
            {product && (
                <>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="version" value={product.version} />
                </>
            )}

            <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className={legendClass}>Identificação</legend>
                <Field label="Nome" name="name" error={errors.name}>
                    {input("name", { required: true, maxLength: 120 })}
                </Field>
                <Field label="Marca" name="brandId" error={errors.brandId}>
                    <select
                        id="brandId"
                        name="brandId"
                        required
                        defaultValue={values.brandId ?? ""}
                        className={inputClassName}
                        {...errorProps("brandId", errors.brandId)}
                    >
                        <option value="" disabled>
                            Escolha a marca
                        </option>
                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="SKU" name="sku" error={errors.sku}>
                    {input("sku", {
                        required: true,
                        maxLength: 40,
                        autoCapitalize: "characters",
                    })}
                </Field>
                <Field label="EAN (opcional)" name="ean" error={errors.ean} hint="8 ou 13 dígitos.">
                    {input("ean", { inputMode: "numeric", maxLength: 16 })}
                </Field>
                {product ? (
                    <p className="text-sm text-muted sm:col-span-2">
                        Endereço: <span className="font-mono text-charcoal">{product.slug}</span> (não muda depois de criado)
                    </p>
                ) : (
                    <div className="sm:col-span-2">
                        <Field
                            label="Endereço (opcional)"
                            name="slug"
                            error={errors.slug}
                            hint="Gerado a partir do nome se ficar vazio. Não muda depois de criado."
                        >
                            {input("slug", {
                                maxLength: 120,
                                placeholder: "ex.: vinocave-120-duo",
                            })}
                        </Field>
                    </div>
                )}
            </fieldset>

            {!product && (
                <fieldset className="grid gap-5 sm:grid-cols-2">
                    <legend className={legendClass}>Preço e stock iniciais</legend>
                    <Field label="Preço (€)" name="price" error={errors.price}>
                        {input("price", { inputMode: "decimal", required: true })}
                    </Field>
                    <Field label="Unidades em armazém" name="stockQuantity" error={errors.stockQuantity}>
                        {input("stockQuantity", {
                            type: "number",
                            inputMode: "numeric",
                            min: 0,
                            max: 9999,
                            required: true,
                        })}
                    </Field>
                </fieldset>
            )}

            <fieldset>
                <legend className={legendClass}>Categorias</legend>
                {categories.length > 0 ? (
                    <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
                        {categories.map((category) => (
                            <label key={category.id} className="flex items-center gap-3 text-sm text-charcoal">
                                <input
                                    type="checkbox"
                                    name="categoryIds"
                                    value={category.id}
                                    defaultChecked={(values.categoryIds ?? "").split(",").includes(category.id)}
                                    className="size-4 accent-wine"
                                />
                                {category.name}
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted">
                        Ainda não há categorias. <Link href="/admin/categorias/nova" className="font-semibold text-wine underline underline-offset-4">Criar categoria</Link>
                    </p>
                )}
                {errors.categoryIds && <p className="mt-2 text-sm text-danger">{errors.categoryIds}</p>}
            </fieldset>

            <fieldset className="space-y-5">
                <legend className={legendClass}>Textos</legend>
                <Field label="Resumo" name="shortDescription" error={errors.shortDescription} hint="10 a 200 caracteres; aparece no catálogo.">
                    <textarea
                        id="shortDescription"
                        name="shortDescription"
                        required
                        rows={2}
                        maxLength={200}
                        defaultValue={values.shortDescription}
                        className={textareaClassName}
                        {...errorProps("shortDescription", errors.shortDescription)}
                    />
                </Field>
                <Field label="Descrição" name="description" error={errors.description}>
                    <textarea
                        id="description"
                        name="description"
                        required
                        rows={6}
                        maxLength={4000}
                        defaultValue={values.description}
                        className={textareaClassName}
                        {...errorProps("description", errors.description)}
                    />
                </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-3">
                <legend className={legendClass}>Especificações</legend>
                <Field label="Capacidade (garrafas)" name="capacity" error={errors.capacity}>
                    {input("capacity", {
                        type: "number",
                        inputMode: "numeric",
                        min: 1,
                        max: 1000,
                        required: true,
                    })}
                </Field>
                <Field label="Zonas de temperatura" name="zones" error={errors.zones}>
                    <select
                        id="zones"
                        name="zones"
                        required
                        defaultValue={values.zones ?? "1"}
                        className={inputClassName}
                        {...errorProps("zones", errors.zones)}
                    >
                        <option value="1">1 zona</option>
                        <option value="2">2 zonas</option>
                        <option value="3">3 zonas</option>
                    </select>
                </Field>
                <Field label="Instalação" name="installationType" error={errors.installationType}>
                    <select
                        id="installationType"
                        name="installationType"
                        required
                        defaultValue={values.installationType ?? "FREESTANDING"}
                        className={inputClassName}
                        {...errorProps("installationType", errors.installationType)}
                    >
                        <option value="FREESTANDING">Livre instalação</option>
                        <option value="BUILT_IN">Encastrável</option>
                        <option value="UNDERCOUNTER">Sob bancada</option>
                    </select>
                </Field>
            </fieldset>

            <fieldset className="space-y-4">
                <legend className={legendClass}>Temperaturas por zona (°C)</legend>
                <p className="text-xs text-muted">Preencha só as zonas que o produto tem.</p>
                {[1, 2, 3].map((position) => (
                    <div key={position} className="grid grid-cols-2 gap-5 sm:grid-cols-[8rem_1fr_1fr] sm:items-end">
                        <p className="col-span-2 text-sm font-medium text-charcoal sm:col-span-1 sm:pb-3">Zona {position}</p>
                        <Field label="Mínima" name={`zone${position}Min`} error={errors[`zone${position}Min`]}>
                            {input(`zone${position}Min`, {
                                type: "number",
                                inputMode: "numeric",
                                min: -10,
                                max: 30,
                            })}
                        </Field>
                        <Field label="Máxima" name={`zone${position}Max`} error={errors[`zone${position}Max`]}>
                            {input(`zone${position}Max`, {
                                type: "number",
                                inputMode: "numeric",
                                min: -10,
                                max: 30,
                            })}
                        </Field>
                    </div>
                ))}
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-4">
                <legend className={legendClass}>Dimensões</legend>
                <Field label="Largura (cm)" name="widthCm" error={errors.widthCm}>
                    {input("widthCm", { inputMode: "decimal", required: true })}
                </Field>
                <Field label="Altura (cm)" name="heightCm" error={errors.heightCm}>
                    {input("heightCm", { inputMode: "decimal", required: true })}
                </Field>
                <Field label="Profundidade (cm)" name="depthCm" error={errors.depthCm}>
                    {input("depthCm", { inputMode: "decimal", required: true })}
                </Field>
                <Field label="Peso (kg, opcional)" name="weightKg" error={errors.weightKg}>
                    {input("weightKg", { inputMode: "decimal" })}
                </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-3">
                <legend className={legendClass}>Energia e ruído (opcional)</legend>
                <Field label="Classe energética" name="energyClass" error={errors.energyClass}>
                    <select
                        id="energyClass"
                        name="energyClass"
                        defaultValue={values.energyClass ?? ""}
                        className={inputClassName}
                        {...errorProps("energyClass", errors.energyClass)}
                    >
                        <option value="">Não indicada</option>
                        {["A", "B", "C", "D", "E", "F", "G"].map((energyClass) => (
                            <option key={energyClass} value={energyClass}>
                                {energyClass}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Consumo anual (kWh)" name="annualEnergyKwh" error={errors.annualEnergyKwh}>
                    {input("annualEnergyKwh", {
                        type: "number",
                        inputMode: "numeric",
                        min: 1,
                        max: 5000,
                    })}
                </Field>
                <Field label="Ruído (dB)" name="noiseDb" error={errors.noiseDb}>
                    {input("noiseDb", {
                        type: "number",
                        inputMode: "numeric",
                        min: 10,
                        max: 90,
                    })}
                </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-2">
                <legend className={legendClass}>Características</legend>
                {featureFields.map(([name, label]) => (
                    <Field key={name} label={label} name={name} error={errors[name]}>
                        <select id={name} name={name} defaultValue={values[name] ?? ""} className={inputClassName} {...errorProps(name, errors[name])}>
                            <option value="">Não indicado</option>
                            <option value="yes">Sim</option>
                            <option value="no">Não</option>
                        </select>
                    </Field>
                ))}
            </fieldset>

            <fieldset className="space-y-5">
                <legend className={legendClass}>SEO (opcional)</legend>
                <Field label="Título SEO" name="seoTitle" error={errors.seoTitle} hint="Até 70 caracteres. Vazio: «Nome | Cave de Vinho N Garrafas».">
                    {input("seoTitle", { maxLength: 70 })}
                </Field>
                <Field label="Descrição SEO" name="seoDescription" error={errors.seoDescription} hint="Até 160 caracteres. Vazio: usa o resumo.">
                    <textarea
                        id="seoDescription"
                        name="seoDescription"
                        rows={2}
                        maxLength={160}
                        defaultValue={values.seoDescription}
                        className={textareaClassName}
                        {...errorProps("seoDescription", errors.seoDescription)}
                    />
                </Field>
            </fieldset>

            <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wine px-5 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
            >
                {isPending && <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {product ? "Guardar detalhes" : "Criar produto"}
            </button>
        </form>
    );
}
