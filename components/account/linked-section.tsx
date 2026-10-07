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
                <h2 className="font-display text-2xl font-semibold text-charcoal">{title}</h2>
                <Link href={href} className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-wine hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine">
                    {linkLabel}
                    <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
            </div>
            {children}
        </section>
    );
}
