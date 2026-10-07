import Link from "next/link";

export function StatCard({
    label,
    value,
    detail,
    href,
    highlight = false,
}: {
    label: string;
    value: string;
    detail?: string;
    href?: string;
    highlight?: boolean;
}) {
    const body = (
        <>
            <p className="text-sm font-medium text-muted">{label}</p>
            <p className={`mt-2 font-display text-4xl font-medium tracking-[-0.03em] ${highlight ? "text-wine" : "text-charcoal"}`}>
                {value}
            </p>
            {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
        </>
    );

    const className = "block rounded-xl border border-border bg-surface p-5";

    return href ? (
        <Link
            href={href}
            className={`${className} transition-colors hover:border-wine/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine`}
        >
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}
