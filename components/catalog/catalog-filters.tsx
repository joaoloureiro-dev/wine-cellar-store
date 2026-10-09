"use client";

import Form from "next/form";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import {
    capacitySegments,
    catalogParams,
    getInstallationLabel,
    IN_STOCK_VALUE,
    installationOptions,
    noiseOptions,
    temperatureOptions,
    widthOptions,
    zoneOptions,
} from "@/lib/catalog/options";
import {
    clearCatalogFilters,
    getCatalogHref,
    type CatalogQuery,
} from "@/lib/catalog/query";
import { buttonStyles } from "@/components/ui/button-styles";
import { useCloseDialogAtBreakpoint } from "@/lib/hooks/use-close-dialog-at-breakpoint";
import { getZonesLabel } from "@/lib/product-display";

export const CATALOG_FILTERS_FORM_ID = "catalog-filters";

type BrandOption = {
    slug: string;
    name: string;
};

type CatalogFiltersProps = {
    query: CatalogQuery;
    brands: BrandOption[];
    categories: BrandOption[];
    energyClasses: string[];
    activeFilterCount: number;
};

/**
 * Catalogue filters as a GET form: works without JavaScript and keeps every
 * filter state in the URL (shareable, back-button friendly). With JS,
 * next/form turns submissions into client-side navigations.
 *
 * Mobile: a modal <dialog> opened from a "Filtros" button.
 * Desktop (lg+): the same <dialog> element is shown inline as a sidebar.
 *
 * Mount with `key` derived from the query so the uncontrolled inputs reset
 * whenever the URL changes (e.g. "Limpar filtros" or removing a chip).
 */
export function CatalogFilters({
    query,
    brands,
    categories,
    energyClasses,
    activeFilterCount,
}: CatalogFiltersProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Optional single-value fields are controlled so empty values can be
    // omitted from the URL (an input without `name` is not submitted).
    const [minPrice, setMinPrice] = useState(query.minPrice?.toString() ?? "");
    const [maxPrice, setMaxPrice] = useState(query.maxPrice?.toString() ?? "");
    const [maxNoise, setMaxNoise] = useState(query.maxNoise?.toString() ?? "");
    const [maxWidth, setMaxWidth] = useState(query.maxWidth?.toString() ?? "");
    const [minTemperature, setMinTemperature] = useState(
        query.minTemperature?.toString() ?? "",
    );

    useCloseDialogAtBreakpoint(dialogRef);

    function openFilters() {
        dialogRef.current?.showModal();
        closeButtonRef.current?.focus();
    }

    function closeFilters() {
        dialogRef.current?.close();
    }

    const clearHref = getCatalogHref(clearCatalogFilters(query));

    return (
        <>
            <button
                type="button"
                onClick={openFilters}
                aria-haspopup="dialog"
                aria-controls="catalog-filters-dialog"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-semibold text-charcoal shadow-card transition-colors hover:border-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:hidden"
            >
                <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
                Filtros
                {activeFilterCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-wine px-1.5 text-[11px] font-bold leading-5 text-white">
                        <span className="sr-only">(</span>
                        {activeFilterCount}
                        <span className="sr-only"> ativos)</span>
                    </span>
                )}
            </button>

            <dialog
                ref={dialogRef}
                id="catalog-filters-dialog"
                aria-labelledby="catalog-filters-heading"
                className="drawer drawer-left fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-full max-w-md overflow-y-auto bg-background p-0 text-foreground shadow-lift sm:rounded-r-3xl lg:static lg:block lg:h-auto lg:w-auto lg:max-w-none lg:overflow-visible lg:rounded-none lg:bg-transparent lg:shadow-none"
            >
                <Form
                    id={CATALOG_FILTERS_FORM_ID}
                    action="/caves"
                    scroll={false}
                    onSubmit={closeFilters}
                    className="flex min-h-full flex-col lg:min-h-0"
                >
                    <div className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-6 lg:h-auto lg:border-0 lg:px-0 lg:pb-1">
                        <h2
                            id="catalog-filters-heading"
                            className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal"
                        >
                            Filtros
                        </h2>

                        <button
                            ref={closeButtonRef}
                            type="button"
                            aria-label="Fechar filtros"
                            onClick={closeFilters}
                            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-charcoal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:hidden"
                        >
                            <X size={22} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                    </div>

                    <div className="flex-1 divide-y divide-border px-5 sm:px-6 lg:px-0">
                        {categories.length > 0 && (
                            <FilterGroup legend="Categoria">
                                {categories.map((category) => (
                                    <Checkbox
                                        key={category.slug}
                                        name={catalogParams.category}
                                        value={category.slug}
                                        defaultChecked={query.categories.includes(category.slug)}
                                    >
                                        {category.name}
                                    </Checkbox>
                                ))}
                            </FilterGroup>
                        )}

                        {brands.length > 0 && (
                            <FilterGroup legend="Marca">
                                {brands.map((brand) => (
                                    <Checkbox
                                        key={brand.slug}
                                        name={catalogParams.brand}
                                        value={brand.slug}
                                        defaultChecked={query.brands.includes(brand.slug)}
                                    >
                                        {brand.name}
                                    </Checkbox>
                                ))}
                            </FilterGroup>
                        )}

                        <FilterGroup legend="Preço">
                            <div className="grid grid-cols-2 gap-3">
                                <NumberField
                                    label="Mínimo (€)"
                                    name={catalogParams.minPrice}
                                    value={minPrice}
                                    onChange={setMinPrice}
                                />

                                <NumberField
                                    label="Máximo (€)"
                                    name={catalogParams.maxPrice}
                                    value={maxPrice}
                                    onChange={setMaxPrice}
                                />
                            </div>
                        </FilterGroup>

                        <FilterGroup legend="Capacidade">
                            {capacitySegments.map((segment) => (
                                <Checkbox
                                    key={segment.value}
                                    name={catalogParams.capacity}
                                    value={segment.value}
                                    defaultChecked={query.capacity.includes(segment.value)}
                                >
                                    {segment.label}
                                </Checkbox>
                            ))}
                        </FilterGroup>

                        <FilterGroup legend="Zonas de temperatura">
                            {zoneOptions.map((zones) => (
                                <Checkbox
                                    key={zones}
                                    name={catalogParams.zones}
                                    value={String(zones)}
                                    defaultChecked={query.zones.includes(zones)}
                                >
                                    {getZonesLabel(zones)}
                                </Checkbox>
                            ))}
                        </FilterGroup>

                        <FilterGroup legend="Instalação">
                            {installationOptions.map((option) => (
                                <Checkbox
                                    key={option.value}
                                    name={catalogParams.installation}
                                    value={option.value}
                                    defaultChecked={query.installation.includes(option.value)}
                                >
                                    {getInstallationLabel(option.value)}
                                </Checkbox>
                            ))}
                        </FilterGroup>

                        <FilterGroup legend="Disponibilidade">
                            <Checkbox
                                name={catalogParams.availability}
                                value={IN_STOCK_VALUE}
                                defaultChecked={query.inStock}
                            >
                                Apenas em stock
                            </Checkbox>
                        </FilterGroup>

                        {energyClasses.length > 0 && (
                            <FilterGroup legend="Classe energética">
                                {energyClasses.map((energyClass) => (
                                    <Checkbox
                                        key={energyClass}
                                        name={catalogParams.energyClass}
                                        value={energyClass}
                                        defaultChecked={query.energyClasses.includes(
                                            energyClass,
                                        )}
                                    >
                                        Classe {energyClass}
                                    </Checkbox>
                                ))}
                            </FilterGroup>
                        )}

                        <FilterGroup legend="Características técnicas">
                            <div className="space-y-4">
                                <SelectField
                                    label="Temperatura mínima"
                                    name={catalogParams.minTemperature}
                                    value={minTemperature}
                                    onChange={setMinTemperature}
                                    options={temperatureOptions.map((value) => ({
                                        value: String(value),
                                        label: `Atinge ${value} °C`,
                                    }))}
                                />

                                <SelectField
                                    label="Nível de ruído"
                                    name={catalogParams.maxNoise}
                                    value={maxNoise}
                                    onChange={setMaxNoise}
                                    options={noiseOptions.map((value) => ({
                                        value: String(value),
                                        label: `Até ${value} dB`,
                                    }))}
                                />

                                <SelectField
                                    label="Largura máxima"
                                    name={catalogParams.maxWidth}
                                    value={maxWidth}
                                    onChange={setMaxWidth}
                                    options={widthOptions.map((value) => ({
                                        value: String(value),
                                        label: `Até ${value} cm`,
                                    }))}
                                />
                            </div>
                        </FilterGroup>
                    </div>

                    <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-border bg-background/90 px-5 py-4 backdrop-blur-md sm:px-6 lg:static lg:grid-cols-1 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-6 lg:backdrop-blur-none">
                        <button
                            type="submit"
                            className={buttonStyles({ className: "order-last px-4 lg:order-first" })}
                        >
                            Aplicar filtros
                        </button>

                        <Link
                            href={clearHref}
                            scroll={false}
                            onClick={closeFilters}
                            className={buttonStyles({ variant: "secondary", className: "px-4" })}
                        >
                            Limpar filtros
                        </Link>
                    </div>
                </Form>
            </dialog>
        </>
    );
}

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
    return (
        <fieldset className="py-5 first:pt-4 lg:first:pt-3">
            <legend className="float-left mb-2 w-full text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-champagne-ink">
                {legend}
            </legend>

            <div className="clear-both space-y-0.5">{children}</div>
        </fieldset>
    );
}

type CheckboxProps = {
    name: string;
    value: string;
    defaultChecked: boolean;
    children: ReactNode;
};

function Checkbox({ name, value, defaultChecked, children }: CheckboxProps) {
    return (
        <label className="-mx-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-2 text-sm text-charcoal transition-colors hover:bg-surface-muted/70">
            <input
                type="checkbox"
                name={name}
                value={value}
                defaultChecked={defaultChecked}
                className="checkbox-cellar"
            />
            {children}
        </label>
    );
}

type FieldProps = {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
};

const fieldClassName =
    "mt-1.5 block h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-charcoal transition-colors hover:border-charcoal/30 focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30";

function NumberField({ label, name, value, onChange }: FieldProps) {
    return (
        <label className="block text-xs font-medium text-muted">
            {label}
            <input
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                name={value ? name : undefined}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={fieldClassName}
            />
        </label>
    );
}

function SelectField({
    label,
    name,
    value,
    onChange,
    options,
}: FieldProps & { options: { value: string; label: string }[] }) {
    return (
        <label className="block text-xs font-medium text-muted">
            {label}
            <select
                name={value ? name : undefined}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={fieldClassName}
            >
                <option value="">Indiferente</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
