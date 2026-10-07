"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/conta", label: "Resumo" },
    { href: "/conta/encomendas", label: "Encomendas" },
    { href: "/conta/reservas", label: "Reservas" },
    { href: "/conta/moradas", label: "Moradas" },
    { href: "/conta/perfil", label: "Perfil" },
] as const;

export function AccountNav() {
    const pathname = usePathname();

    return (
        <nav aria-label="Área de cliente" className="relative -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;

                    return (
                        <li key={link.href} className="shrink-0">
                            <Link
                                href={link.href}
                                aria-current={isActive ? "page" : undefined}
                                className={`block rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-wine ${
                                    isActive
                                        ? "bg-charcoal text-white"
                                        : "text-charcoal hover:bg-surface-muted"
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
