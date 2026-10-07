"use client";

import Link from "next/link";
import { ArrowRight, Heart, Menu, ShoppingBag, Truck, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
        href: "/#como-escolher",
    },
    {
        label: "Reservas",
        href: "/reservas",
    },
];

const menuShortcuts = [
    { label: "Conta", href: "/conta", icon: UserRound },
    { label: "Favoritos", href: "/favoritos", icon: Heart },
    { label: "Carrinho", href: "/carrinho", icon: ShoppingBag },
];

const iconButton =
    "inline-flex size-11 items-center justify-center rounded-full text-charcoal transition-colors duration-200 hover:bg-charcoal/5 hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine";

function Wordmark({ className = "" }: { className?: string }) {
    return (
        <span
            className={`inline-flex items-baseline font-display font-semibold tracking-[-0.03em] text-charcoal ${className}`}
        >
            {siteConfig.name}
            <span aria-hidden="true" className="ml-0.5 size-1.5 -translate-y-0.5 rounded-full bg-wine" />
        </span>
    );
}

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Frosted, compact header once the page scrolls. Only colours and a
    // transform change, so the layout below never shifts.
    useEffect(() => {
        function update() {
            setIsScrolled(window.scrollY > 8);
        }

        update();
        window.addEventListener("scroll", update, { passive: true });

        return () => window.removeEventListener("scroll", update);
    }, []);

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
        <>
            <div className="bg-cellar px-4 py-2.5 text-center text-xs tracking-[0.04em] text-cellar-muted">
                <span className="inline-flex items-center gap-2">
                    <Truck size={14} strokeWidth={1.8} aria-hidden="true" className="text-champagne" />
                    Entrega especializada em{" "}
                    <strong className="font-semibold text-champagne-soft">Portugal Continental</strong>
                </span>
            </div>

            <header
                data-scrolled={isScrolled}
                className="sticky top-0 z-40 border-b border-transparent bg-background transition-[background-color,border-color,box-shadow] duration-300 ease-cellar data-[scrolled=true]:border-charcoal/8 data-[scrolled=true]:bg-background/80 data-[scrolled=true]:shadow-card data-[scrolled=true]:backdrop-blur-xl data-[scrolled=true]:backdrop-saturate-150 motion-reduce:transition-none"
            >
                <Container>
                    <div className="flex h-16 items-center justify-between gap-6 lg:h-20">
                        <Link
                            href="/"
                            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine"
                            aria-label={`${siteConfig.name} - Página inicial`}
                        >
                            <Wordmark className="origin-left text-[1.75rem] transition-transform duration-300 ease-cellar in-data-[scrolled=true]:scale-90 motion-reduce:transition-none lg:text-3xl" />
                        </Link>

                        <nav
                            className="hidden items-center gap-9 lg:flex"
                            aria-label="Navegação principal"
                        >
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="relative rounded-sm py-1.5 text-sm font-medium text-charcoal transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-champagne after:transition-transform after:duration-300 after:ease-cellar hover:after:scale-x-100 motion-reduce:after:transition-none"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="flex items-center">
                            <Link
                                href="/favoritos"
                                aria-label="Favoritos"
                                className={`${iconButton} hidden md:inline-flex`}
                            >
                                <Heart size={20} strokeWidth={1.8} aria-hidden="true" />
                            </Link>

                            <Link
                                href="/conta"
                                aria-label="Conta"
                                className={`${iconButton} hidden sm:inline-flex`}
                            >
                                <UserRound size={20} strokeWidth={1.8} aria-hidden="true" />
                            </Link>

                            <CartLink className={iconButton} />

                            <button
                                type="button"
                                aria-label="Abrir menu"
                                aria-expanded={isMenuOpen}
                                aria-controls="mobile-navigation"
                                onClick={openMenu}
                                className={`${iconButton} -mr-2 lg:hidden`}
                            >
                                <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </Container>

                {/*
                  Native modal dialog: Escape closes it, focus stays inside while
                  open and the rest of the page becomes inert. It slides in from
                  the right (see .drawer in globals.css); no display utility on
                  the element itself, so the closed dialog stays hidden.
                */}
                <dialog
                    ref={menuRef}
                    id="mobile-navigation"
                    aria-label="Menu"
                    onClose={() => setIsMenuOpen(false)}
                    className="drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md overflow-y-auto bg-background p-0 text-foreground shadow-lift sm:rounded-l-3xl lg:hidden"
                >
                    <div className="flex min-h-full flex-col px-5 pb-8 sm:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <Link
                                href="/"
                                onClick={closeMenu}
                                className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine"
                            >
                                <Wordmark className="text-[1.75rem]" />
                            </Link>

                            <button
                                ref={closeButtonRef}
                                type="button"
                                aria-label="Fechar menu"
                                onClick={closeMenu}
                                className={`${iconButton} -mr-2`}
                            >
                                <X size={24} strokeWidth={1.8} aria-hidden="true" />
                            </button>
                        </div>

                        <nav className="flex flex-1 flex-col pt-4" aria-label="Navegação mobile">
                            <ul role="list" className="border-t border-border">
                                {navigation.map((item) => (
                                    <li key={item.href} className="border-b border-border">
                                        <Link
                                            href={item.href}
                                            onClick={closeMenu}
                                            className="group flex items-center justify-between gap-4 rounded-sm py-5 font-display text-[2rem] font-medium leading-none tracking-[-0.02em] text-charcoal transition-colors hover:text-wine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                                        >
                                            {item.label}
                                            <ArrowRight
                                                size={20}
                                                strokeWidth={1.6}
                                                aria-hidden="true"
                                                className="text-champagne transition-transform duration-300 ease-cellar group-hover:translate-x-1 motion-reduce:transition-none"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            <ul role="list" className="mt-8 grid grid-cols-3 gap-3">
                                {menuShortcuts.map(({ label, href, icon: Icon }) => (
                                    <li key={href}>
                                        <Link
                                            href={href}
                                            onClick={closeMenu}
                                            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-2 py-4 text-sm font-semibold text-charcoal shadow-card transition-colors hover:border-champagne focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                                        >
                                            <Icon size={20} strokeWidth={1.8} aria-hidden="true" className="text-wine" />
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto pt-10">
                                <div className="rounded-3xl bg-cellar p-6 text-cellar-ink">
                                    <p className="font-display text-2xl font-medium leading-tight">
                                        Reserve sem pagamento imediato.
                                    </p>
                                    <p className="mt-2 text-sm text-cellar-muted">
                                        Escolha a cave e confirmamos a disponibilidade consigo.
                                    </p>
                                    <Link
                                        href="/reservas"
                                        onClick={closeMenu}
                                        className="mt-4 inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-champagne-soft underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne-soft"
                                    >
                                        Saber mais sobre reservas
                                        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                                    </Link>
                                </div>
                            </div>
                        </nav>
                    </div>
                </dialog>
            </header>
        </>
    );
}
