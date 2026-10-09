import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

type StatCardProps = {
    label: string;
    value: string;
    detail?: string;
    href?: string;
    /** Needs attention: wine accent. */
    highlight?: boolean;
    icon?: LucideIcon;
    /** Dark cellar card for the headline figure. */
    tone?: "light" | "dark";
};

export function StatCard({ label, value, detail, href, highlight = false, icon: Icon, tone = "light" }: StatCardProps) {
    const isDark = tone === "dark";

    const body = (
        <>
            <div className="flex items-start justify-between gap-3">
                <p className={`text-sm font-medium ${isDark ? "text-cellar-muted" : "text-muted"}`}>{label}</p>
                {Icon && (
                    <span
                        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                            isDark
                                ? "bg-cellar-ink/10 text-champagne-soft"
                                : highlight
                                  ? "bg-wine text-white"
                                  : "bg-wine-light text-wine"
                        }`}
                    >
                        <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                    </span>
                )}
            </div>
            <p
                className={`mt-3 font-display text-[2.75rem] font-medium leading-none tracking-[-0.03em] tabular-nums ${
                    isDark ? "text-cellar-ink" : highlight ? "text-wine" : "text-charcoal"
                }`}
            >
                {value}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
                {detail && <p className={`text-xs ${isDark ? "text-cellar-muted" : "text-muted"}`}>{detail}</p>}
                {href && (
                    <ArrowUpRight
                        size={16}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="ml-auto shrink-0 text-muted transition-transform duration-300 ease-cellar group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-wine motion-reduce:transition-none"
                    />
                )}
            </div>
        </>
    );

    const className = `group relative block overflow-hidden rounded-3xl p-5 sm:p-6 ${
        isDark
            ? "surface-cellar shadow-lift"
            : `border bg-surface shadow-card ${highlight ? "border-wine/25" : "border-charcoal/8"}`
    }`;

    return href ? (
        <Link
            href={href}
            className={`${className} transition-[transform,box-shadow,border-color] duration-300 ease-cellar hover:-translate-y-0.5 hover:border-champagne/50 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
        >
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}
