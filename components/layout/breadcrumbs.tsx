import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

type BreadcrumbsProps = {
    items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={item.label} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="rounded-sm underline-offset-4 transition-colors hover:text-wine hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    aria-current={isLast ? "page" : undefined}
                                    className={isLast ? "font-semibold text-charcoal" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <ChevronRight
                                    size={14}
                                    strokeWidth={1.6}
                                    aria-hidden="true"
                                    className="text-champagne"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
