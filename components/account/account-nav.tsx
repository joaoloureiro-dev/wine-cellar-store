"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    CalendarCheck,
    LayoutDashboard,
    MapPin,
    PackageCheck,
    ShieldCheck,
    UserRound,
    type LucideIcon,
} from "lucide-react";

const links: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/conta", label: "Resumo", icon: LayoutDashboard },
    { href: "/conta/encomendas", label: "Encomendas", icon: PackageCheck },
    { href: "/conta/reservas", label: "Reservas", icon: CalendarCheck },
    { href: "/conta/moradas", label: "Moradas", icon: MapPin },
    { href: "/conta/perfil", label: "Perfil", icon: UserRound },
];

export function AccountNav({ showAdmin = false }: { showAdmin?: boolean }) {
    const pathname = usePathname();
    const items = showAdmin ? [...links, { href: "/admin", label: "Backoffice", icon: ShieldCheck }] : links;

    return (
        <nav aria-label="Área de cliente" className="relative -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
                {items.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;

                    return (
                        <li key={href} className="shrink-0">
                            <Link
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine lg:rounded-2xl ${
                                    isActive
                                        ? "bg-wine text-white shadow-wine"
                                        : "border border-border bg-surface text-charcoal hover:border-champagne lg:border-transparent lg:bg-transparent lg:hover:bg-surface-muted"
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
