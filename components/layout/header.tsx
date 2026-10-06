"use client";

import Link from "next/link";
import {
    Heart,
    Menu,
    Search,
    ShoppingBag,
    UserRound,
    X,
} from "lucide-react";
import { useRef, useState } from "react";

import { CartLink } from "@/components/cart/cart-link";
import { Container } from "@/components/layout/container";
import { useCloseDialogAtBreakpoint } from "@/lib/hooks/use-close-dialog-at-breakpoint";
import { siteConfig } from "@/lib/site";

const navigation = [
    {
        label: "Caves de Vinho",
        href: "/caves",
    },
    {
        label: "Marcas",
        href: "/marcas",
    },
    {
        label: "Como escolher",
        href: "/guia",
    },
    {
        label: "Reservas",
        href: "/reservas",
    },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    function openMenu() {
        menuRef.current?.showModal();
        closeButtonRef.current?.focus();
        setIsMenuOpen(true);
    }

    function closeMenu() {
        // Triggers the dialog's `close` event, which resets state and
        // returns focus to the menu button.
        menuRef.current?.close();
    }

    useCloseDialogAtBreakpoint(menuRef);

    return (
        <header className="border-b border-border bg-surface">
            <div className="bg-charcoal py-2.5 text-center text-xs font-medium tracking-wide text-white">
                Entrega especializada em Portugal Continental
            </div>

            <Container>
                <div className="flex h-20 items-center justify-between gap-6">
                    <Link
                        href="/"
                        className="shrink-0"
                        aria-label={`${siteConfig.name} - Página inicial`}
                    >
                        <span className="font-display text-2xl font-semibold tracking-[-0.03em] text-charcoal sm:text-3xl">
                            {siteConfig.name}
                        </span>
                    </Link>

                    <nav
                        className="hidden items-center gap-8 lg:flex"
                        aria-label="Navegação principal"
                    >
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-sm font-medium text-charcoal transition-colors hover:text-wine"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center">
                        <Link
                            href="/pesquisa"
                            aria-label="Pesquisar"
                            className="hidden rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted hover:text-wine sm:inline-flex"
                        >
                            <Search size={20} strokeWidth={1.8} />
                        </Link>

                        <Link
                            href="/favoritos"
                            aria-label="Favoritos"
                            className="hidden rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted hover:text-wine md:inline-flex"
                        >
                            <Heart size={20} strokeWidth={1.8} />
                        </Link>

                        <Link
                            href="/conta"
                            aria-label="Conta"
                            className="hidden rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted hover:text-wine sm:inline-flex"
                        >
                            <UserRound size={20} strokeWidth={1.8} />
                        </Link>

                        <CartLink className="rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted hover:text-wine" />

                        <button
                            type="button"
                            aria-label="Abrir menu"
                            aria-expanded={isMenuOpen}
                            aria-controls="mobile-navigation"
                            onClick={openMenu}
                            className="ml-1 inline-flex rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted lg:hidden"
                        >
                            <Menu size={23} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>
            </Container>

            {/*
              Native modal dialog: Escape closes it, focus stays inside while
              open and the rest of the page becomes inert. No display utility
              on the element itself, so the closed dialog stays hidden.
            */}
            <dialog
                ref={menuRef}
                id="mobile-navigation"
                aria-label="Menu"
                onClose={() => setIsMenuOpen(false)}
                className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-y-auto bg-surface p-0 text-foreground lg:hidden"
            >
                <Container className="flex min-h-screen flex-col">
                    <div className="flex h-20 items-center justify-between border-b border-border">
                        <Link
                            href="/"
                            onClick={closeMenu}
                            className="font-display text-2xl font-semibold tracking-[-0.03em] text-charcoal"
                        >
                            {siteConfig.name}
                        </Link>

                        <button
                            ref={closeButtonRef}
                            type="button"
                            aria-label="Fechar menu"
                            onClick={closeMenu}
                            className="rounded-md p-2.5 text-charcoal transition-colors hover:bg-surface-muted"
                        >
                            <X size={24} strokeWidth={1.8} />
                        </button>
                    </div>

                    <nav
                        className="flex flex-1 flex-col py-8"
                        aria-label="Navegação mobile"
                    >
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className="border-b border-border py-5 font-display text-3xl font-medium text-charcoal transition-colors hover:text-wine"
                            >
                                {item.label}
                            </Link>
                        ))}

                        <div className="mt-8 grid grid-cols-2 gap-3">
                            <Link
                                href="/pesquisa"
                                onClick={closeMenu}
                                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-4 text-sm font-semibold text-charcoal"
                            >
                                <Search size={19} strokeWidth={1.8} />
                                Pesquisar
                            </Link>

                            <Link
                                href="/conta"
                                onClick={closeMenu}
                                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-4 text-sm font-semibold text-charcoal"
                            >
                                <UserRound size={19} strokeWidth={1.8} />
                                Conta
                            </Link>

                            <Link
                                href="/favoritos"
                                onClick={closeMenu}
                                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-4 text-sm font-semibold text-charcoal"
                            >
                                <Heart size={19} strokeWidth={1.8} />
                                Favoritos
                            </Link>

                            <Link
                                href="/carrinho"
                                onClick={closeMenu}
                                className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-4 text-sm font-semibold text-charcoal"
                            >
                                <ShoppingBag size={19} strokeWidth={1.8} />
                                Carrinho
                            </Link>
                        </div>
                    </nav>
                </Container>
            </dialog>
        </header>
    );
}