"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/admin", label: "Resumo" },
    { href: "/admin/encomendas", label: "Encomendas" },
    { href: "/admin/reservas", label: "Reservas" },
    { href: "/admin/produtos", label: "Produtos" },
] as const;

export function AdminNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Backoffice" className="relative -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
                {links.map((link) => {
                    const isActive =
                        link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

                    return (
                        <li key={link.href} className="shrink-0">
                            <Link
                                href={link.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`block rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-wine ${
                                    isActive ? "bg-charcoal text-white" : "text-charcoal hover:bg-surface-muted"
                                }`}
                            >
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
