import Link from "next/link";
import { X } from "lucide-react";

import {
    capacitySegments,
    getInstallationLabel,
} from "@/lib/catalog/options";
import {
    clearCatalogFilters,
    getCatalogHref,
    type CatalogQuery,
} from "@/lib/catalog/query";
import { formatCurrency } from "@/lib/format";
import { getZonesLabel } from "@/lib/product-display";

type ActiveFiltersProps = {
    query: CatalogQuery;
    brandNames: Map<string, string>;
};

type Chip = {
    key: string;
    label: string;
    query: CatalogQuery;
};

function without<T>(values: T[], value: T) {
    return values.filter((item) => item !== value);
}

function getPriceLabel(minPrice?: number, maxPrice?: number) {
    if (minPrice !== undefined && maxPrice !== undefined) {
        return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
    }

    return minPrice !== undefined
        ? `Desde ${formatCurrency(minPrice)}`
        : `Até ${formatCurrency(maxPrice ?? 0)}`;
}

function getChips(query: CatalogQuery, brandNames: Map<string, string>): Chip[] {
    const chips: Chip[] = [];

    for (const brand of query.brands) {
        chips.push({
            key: `brand-${brand}`,
            label: brandNames.get(brand) ?? brand,
            query: { ...query, brands: without(query.brands, brand) },
        });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        chips.push({
            key: "price",
            label: getPriceLabel(query.minPrice, query.maxPrice),
            query: { ...query, minPrice: undefined, maxPrice: undefined },
        });
    }

    for (const value of query.capacity) {
        chips.push({
            key: `capacity-${value}`,
            label:
                capacitySegments.find((segment) => segment.value === value)?.label ??
                value,
            query: { ...query, capacity: without(query.capacity, value) },
        });
    }

    for (const zones of query.zones) {
        chips.push({
            key: `zones-${zones}`,
            label: getZonesLabel(zones),
            query: { ...query, zones: without(query.zones, zones) },
        });
    }

    for (const value of query.installation) {
        chips.push({
            key: `installation-${value}`,
            label: getInstallationLabel(value),
            query: { ...query, installation: without(query.installation, value) },
        });
    }

    if (query.inStock) {
        chips.push({
            key: "in-stock",
            label: "Em stock",
            query: { ...query, inStock: false },
        });
    }

    for (const energyClass of query.energyClasses) {
        chips.push({
            key: `energy-${energyClass}`,
            label: `Classe ${energyClass}`,
            query: {
                ...query,
                energyClasses: without(query.energyClasses, energyClass),
            },
        });
    }

    if (query.minTemperature !== undefined) {
        chips.push({
            key: "temperature",
            label: `Atinge ${query.minTemperature} °C`,
            query: { ...query, minTemperature: undefined },
        });
    }

    if (query.maxNoise !== undefined) {
        chips.push({
            key: "noise",
            label: `Até ${query.maxNoise} dB`,
            query: { ...query, maxNoise: undefined },
        });
    }

    if (query.maxWidth !== undefined) {
        chips.push({
            key: "width",
            label: `Largura até ${query.maxWidth} cm`,
            query: { ...query, maxWidth: undefined },
        });
    }

    return chips;
}

export function ActiveFilters({ query, brandNames }: ActiveFiltersProps) {
    const chips = getChips(query, brandNames);

    if (chips.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <h2 className="sr-only">Filtros ativos</h2>

            <ul role="list" className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                    <li key={chip.key}>
                        <Link
                            href={getCatalogHref(chip.query)}
                            scroll={false}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3.5 pr-2.5 text-xs font-semibold text-charcoal transition-colors hover:border-wine hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                        >
                            {chip.label}
                            <X size={14} strokeWidth={2} aria-hidden="true" />
                            <span className="sr-only">(remover filtro)</span>
                        </Link>
                    </li>
                ))}
            </ul>

            <Link
                href={getCatalogHref(clearCatalogFilters(query))}
                scroll={false}
                className="ml-1 rounded-sm text-xs font-semibold text-muted underline underline-offset-4 transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                Limpar tudo
            </Link>
        </div>
    );
}
