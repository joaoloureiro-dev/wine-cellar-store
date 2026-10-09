import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Titled section with a "see all" style link, used on overview pages. */
export function LinkedSection({
    title,
    href,
    linkLabel,
    children,
}: {
    title: string;
    href: string;
    linkLabel: string;
    children: ReactNode;
}) {
    return (
        <section aria-label={title}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal">{title}</h2>
                <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:border-champagne focus-visible:outline-2 focus-visible:outline-wine">
                    {linkLabel}
                    <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" className="transition-transform duration-300 ease-cellar group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
            </div>
            {children}
        </section>
    );
}
