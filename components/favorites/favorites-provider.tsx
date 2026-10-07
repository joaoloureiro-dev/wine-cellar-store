"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/client";
import { mergeFavoritesAction, setFavoriteAction } from "@/lib/favorites/actions";
import { GUEST_FAVORITES_KEY, MAX_FAVORITES } from "@/lib/favorites/constants";

type FavoritesContextValue = {
    ids: string[];
    isReady: boolean;
    isSignedIn: boolean;
    isFavorite: (productId: string) => boolean;
    toggle: (productId: string, productName: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites() {
    const context = useContext(FavoritesContext);

    if (!context) {
        throw new Error("useFavorites must be used inside <FavoritesProvider>.");
    }

    return context;
}

function readGuestFavorites(): string[] {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(GUEST_FAVORITES_KEY) ?? "[]");
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
        return [];
    }
}

function writeGuestFavorites(ids: string[]) {
    try {
        if (ids.length === 0) {
            localStorage.removeItem(GUEST_FAVORITES_KEY);
        } else {
            localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
        }
    } catch {
        // Storage unavailable (private mode): favourites last for this visit.
    }
}

/**
 * Favourites for guests live in localStorage; for signed-in customers in
 * the database. Guest favourites are merged into the account once the
 * customer signs in. Reloaded only when the signed-in user changes (not
 * on every navigation), so static pages stay static.
 */
export function FavoritesProvider({ children }: { children: ReactNode }) {
    const toast = useToast();
    const [ids, setIds] = useState<string[]>([]);
    const [signedIn, setSignedIn] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const session = authClient.useSession();
    // undefined while the session is loading, null for guests.
    const userId = session.isPending ? undefined : (session.data?.user.id ?? null);

    useEffect(() => {
        if (userId === undefined) return;

        let cancelled = false;

        (async () => {
            const guestIds = readGuestFavorites();

            try {
                const response = await fetch("/api/favorites", { cache: "no-store" });
                const data = (await response.json()) as { signedIn: boolean; productIds: string[] };

                if (cancelled) return;

                if (data.signedIn) {
                    const merged = guestIds.length > 0 ? await mergeFavoritesAction(guestIds) : data.productIds;

                    if (guestIds.length > 0 && merged) {
                        writeGuestFavorites([]);
                    }

                    setIds(merged ?? data.productIds);
                    setSignedIn(true);
                } else {
                    setIds(guestIds);
                    setSignedIn(false);
                }
            } catch {
                if (cancelled) return;
                setIds(guestIds);
                setSignedIn(false);
            } finally {
                if (!cancelled) setIsReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const toggle = useCallback(
        (productId: string, productName: string) => {
            const willFavorite = !ids.includes(productId);
            const next = willFavorite ? [productId, ...ids] : ids.filter((id) => id !== productId);

            setIds(next);

            if (willFavorite) {
                toast.success("Adicionado aos favoritos", {
                    description: productName,
                    action: { label: "Ver favoritos", href: "/favoritos" },
                });
            } else {
                toast.info("Removido dos favoritos", { description: productName });
            }

            if (!signedIn) {
                writeGuestFavorites(next);
                return;
            }

            setFavoriteAction(productId, willFavorite)
                .then((result) => {
                    if (!result.ok) throw new Error("Not saved");
                })
                .catch(() => {
                    setIds(ids);
                    toast.error("Não foi possível atualizar os favoritos", {
                        description: "Tente novamente.",
                    });
                });
        },
        [ids, signedIn, toast],
    );

    const value = useMemo<FavoritesContextValue>(
        () => ({ ids, isReady, isSignedIn: signedIn, isFavorite: (id) => ids.includes(id), toggle }),
        [ids, isReady, signedIn, toggle],
    );

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
