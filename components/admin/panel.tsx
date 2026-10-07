import type { ReactNode } from "react";

/** Bordered card with a heading, used on backoffice detail pages. */
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
    return (
        <section aria-label={title} className={`rounded-xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
            {children}
        </section>
    );
}

export function Timeline({ items }: { items: { id: string; title: string; meta: string; note?: string | null }[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-muted">Sem registos.</p>;
    }

    return (
        <ol className="space-y-4 border-l border-border pl-4">
            {items.map((item) => (
                <li key={item.id} className="relative">
                    <span aria-hidden="true" className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-wine" />
                    <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                    <p className="text-xs text-muted">{item.meta}</p>
                    {item.note && <p className="mt-1 text-sm break-words text-charcoal">{item.note}</p>}
                </li>
            ))}
        </ol>
    );
}
