import { z } from "zod";

export const ADMIN_PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * Parses the shared list filters (?estado=&q=&pagina=). Unknown or
 * malformed values fall back to "no filter" instead of erroring.
 */
export function parseListParams<const S extends readonly [string, ...string[]]>(
    searchParams: SearchParams,
    statuses: S,
) {
    const status = z.enum(statuses).safeParse(first(searchParams.estado));
    const q = z.string().trim().max(100).safeParse(first(searchParams.q));
    const page = z.coerce.number().int().min(1).max(10_000).safeParse(first(searchParams.pagina));

    return {
        status: status.success ? status.data : undefined,
        q: q.success && q.data ? q.data : undefined,
        page: page.success ? page.data : 1,
    };
}

/** Builds a list URL keeping the current filters. */
export function listHref(
    pathname: string,
    params: { status?: string; q?: string; page?: number },
) {
    const search = new URLSearchParams();

    if (params.status) search.set("estado", params.status);
    if (params.q) search.set("q", params.q);
    if (params.page && params.page > 1) search.set("pagina", String(params.page));

    const query = search.toString();
    return query ? `${pathname}?${query}` : pathname;
}
