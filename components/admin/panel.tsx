import type { ReactNode } from "react";

/** Bordered card with a heading, used on backoffice detail pages. */
export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
    return (
        <section aria-label={title} className={`rounded-3xl border border-charcoal/8 bg-surface p-5 shadow-card sm:p-7 ${className}`}>
            <h2 className="mb-5 text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-champagne-ink">{title}</h2>
            {children}
        </section>
    );
}

export function Timeline({ items }: { items: { id: string; title: string; meta: string; note?: string | null }[] }) {
    if (items.length === 0) {
        return <p className="text-sm text-muted">Sem registos.</p>;
    }

    return (
        <ol className="space-y-5 border-l border-champagne/50 pl-5">
            {items.map((item) => (
                <li key={item.id} className="relative">
                    <span aria-hidden="true" className="absolute top-1 -left-[1.6rem] size-2.5 rounded-full bg-wine ring-4 ring-surface" />
                    <p className="text-sm font-semibold text-charcoal">{item.title}</p>
                    <p className="text-xs text-muted">{item.meta}</p>
                    {item.note && <p className="mt-1 text-sm break-words text-charcoal">{item.note}</p>}
                </li>
            ))}
        </ol>
    );
}
