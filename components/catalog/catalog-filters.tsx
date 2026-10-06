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
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:hidden"
            >
                <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
                Filtros
                {activeFilterCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-wine px-1.5 text-[11px] font-bold text-white">
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
                className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-y-auto bg-surface p-0 text-foreground lg:static lg:block lg:size-auto lg:overflow-visible lg:bg-transparent"
            >
                <Form
                    id={CATALOG_FILTERS_FORM_ID}
                    action="/caves"
                    scroll={false}
                    onSubmit={closeFilters}
                    className="flex min-h-full flex-col lg:min-h-0"
                >
                    <div className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-6 lg:h-auto lg:border-0 lg:px-0 lg:pb-2">
                        <h2
                            id="catalog-filters-heading"
                            className="font-display text-2xl font-semibold text-charcoal"
                        >
                            Filtros
                        </h2>

                        <button
                            ref={closeButtonRef}
                            type="button"
                            aria-label="Fechar filtros"
                            onClick={closeFilters}
                            className="rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted lg:hidden"
                        >
                            <X size={22} strokeWidth={1.8} />
                        </button>
                    </div>

                    <div className="flex-1 divide-y divide-border px-5 sm:px-6 lg:px-0">
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

                    <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-border bg-surface px-5 py-4 sm:px-6 lg:static lg:grid-cols-1 lg:border-0 lg:bg-transparent lg:px-0 lg:pt-6">
                        <button
                            type="submit"
                            className="order-last inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-4 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:order-first"
                        >
                            Aplicar filtros
                        </button>

                        <Link
                            href={clearHref}
                            scroll={false}
                            onClick={closeFilters}
                            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
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
        <fieldset className="py-5 first:pt-4 lg:first:pt-2">
            <legend className="float-left mb-3 w-full text-xs font-bold uppercase tracking-[0.16em] text-charcoal">
                {legend}
            </legend>

            <div className="clear-both space-y-1">{children}</div>
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
        <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm text-charcoal">
            <input
                type="checkbox"
                name={name}
                value={value}
                defaultChecked={defaultChecked}
                className="size-4 shrink-0 cursor-pointer accent-wine"
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
    "mt-1.5 block h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-charcoal focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30";

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
