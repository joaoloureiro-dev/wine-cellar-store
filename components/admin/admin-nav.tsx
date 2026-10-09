"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LayoutDashboard, Package, ReceiptText, Tags, type LucideIcon } from "lucide-react";

const links: readonly { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/admin", label: "Resumo", icon: LayoutDashboard },
    { href: "/admin/encomendas", label: "Encomendas", icon: ReceiptText },
    { href: "/admin/reservas", label: "Reservas", icon: CalendarCheck },
    { href: "/admin/produtos", label: "Produtos", icon: Package },
    { href: "/admin/marcas", label: "Marcas", icon: Tags },
];

/**
 * Pills that scroll sideways on small screens; a vertical list inside the
 * dark cellar sidebar from lg up.
 */
export function AdminNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Backoffice" className="relative -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
                {links.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

                    return (
                        <li key={href} className="shrink-0">
                            <Link
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:rounded-2xl lg:focus-visible:outline-champagne-soft ${
                                    isActive
                                        ? "bg-wine text-white shadow-wine lg:bg-cellar-ink/10 lg:text-champagne-soft lg:shadow-none"
                                        : "border border-border bg-surface text-charcoal hover:border-champagne lg:border-transparent lg:bg-transparent lg:text-cellar-muted lg:hover:bg-cellar-ink/5 lg:hover:text-cellar-ink"
                                }`}
                            >
                                <Icon size={18} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
