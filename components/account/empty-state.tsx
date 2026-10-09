import Link from "next/link";

export function EmptyState({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
    return (
        <div className="rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-10 text-center">
            <p className="font-display text-[1.75rem] font-medium tracking-[-0.02em] text-charcoal">{title}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
            <Link
                href={href}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
            >
                {cta}
            </Link>
        </div>
    );
}
