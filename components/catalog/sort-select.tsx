"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CATALOG_FILTERS_FORM_ID } from "@/components/catalog/catalog-filters";
import {
    catalogParams,
    DEFAULT_SORT,
    sortOptions,
    type SortValue,
} from "@/lib/catalog/options";
import { getCatalogHref, type CatalogQuery } from "@/lib/catalog/query";

type SortSelectProps = {
    query: CatalogQuery;
};

/**
 * Applies the new order immediately with JS. Without JS, the select still
 * belongs to the filters form (via `form`) and is submitted with it.
 */
export function SortSelect({ query }: SortSelectProps) {
    const router = useRouter();
    const [sort, setSort] = useState<SortValue>(query.sort);

    function handleChange(value: SortValue) {
        setSort(value);
        router.push(getCatalogHref({ ...query, sort: value }), { scroll: false });
    }

    return (
        <label className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">Ordenar por</span>
            <span className="sr-only sm:hidden">Ordenar por</span>

            <select
                form={CATALOG_FILTERS_FORM_ID}
                name={sort === DEFAULT_SORT ? undefined : catalogParams.sort}
                value={sort}
                onChange={(event) => handleChange(event.target.value as SortValue)}
                className="h-11 rounded-md border border-border bg-surface px-3 text-sm font-semibold text-charcoal focus:border-wine focus:outline-2 focus:outline-offset-0 focus:outline-wine/30"
            >
                {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
