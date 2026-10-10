"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";

export function FavoritesView() {
    const { ids, isReady } = useFavorites();
    const [loaded, setLoaded] = useState<{ key: string; products: Product[] } | null>(null);
    const key = ids.join(",");

    useEffect(() => {
        if (!isReady || !key) return;

        let cancelled = false;
        fetch(`/api/products?ids=${encodeURIComponent(key)}`)
            .then((response) => response.json() as Promise<{ products: Product[] }>)
            .then((data) => {
                if (!cancelled) setLoaded({ key, products: data.products });
            })
            .catch(() => {
                if (!cancelled) setLoaded({ key, products: [] });
            });

        return () => {
            cancelled = true;
        };
    }, [isReady, key]);

    // Removing a favourite only shrinks the list, so the last fetch can be
    // reused; adding one (another tab) waits for the new fetch.
    const products = loaded?.products ?? [];
    const hasAllProducts = !key || (loaded !== null && ids.every((id) => loaded.key.split(",").includes(id)));

    if (!isReady || !hasAllProducts) {
        return <p className="text-sm text-muted" aria-live="polite">A carregar favoritos…</p>;
    }

    // Keep removed items out immediately, without waiting for a refetch.
    const visible = products.filter((product) => ids.includes(product.id));

    if (visible.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-16 text-center">
                <span className="inline-flex size-16 items-center justify-center rounded-full bg-wine-light text-wine">
                    <Heart size={28} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <h2 className="mt-6 font-display text-3xl font-medium tracking-[-0.02em] text-charcoal">Ainda não tem favoritos</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                    Toque no coração de uma cave para a guardar aqui e comparar mais tarde.
                </p>
                <Link href="/caves" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-wine px-6 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine">
                    Explorar caves
                </Link>
            </div>
        );
    }

    return (
        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {visible.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product} headingLevel="h2" />
                </li>
            ))}
        </ul>
    );
}
