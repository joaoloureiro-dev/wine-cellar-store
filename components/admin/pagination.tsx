import Link from "next/link";

import { listHref } from "@/lib/admin/list-params";

export function Pagination({
    pathname,
    page,
    pageCount,
    total,
    status,
    q,
}: {
    pathname: string;
    page: number;
    pageCount: number;
    total: number;
    status?: string;
    q?: string;
}) {
    const linkClass =
        "inline-flex h-10 items-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-charcoal transition-colors hover:border-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine";

    return (
        <nav aria-label="Paginação" className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
            <p>
                {total} {total === 1 ? "resultado" : "resultados"} · página {Math.min(page, pageCount)} de {pageCount}
            </p>
            <div className="flex gap-2">
                {page > 1 && (
                    <Link href={listHref(pathname, { status, q, page: page - 1 })} className={linkClass} rel="prev">
                        Anterior
                    </Link>
                )}
                {page < pageCount && (
                    <Link href={listHref(pathname, { status, q, page: page + 1 })} className={linkClass} rel="next">
                        Seguinte
                    </Link>
                )}
            </div>
        </nav>
    );
}
