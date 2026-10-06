"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";
import { notifyCartUpdated } from "@/lib/cart/events";

/**
 * One-off effects after placing an order: confirmation toast, refresh the
 * header cart count (the cart was emptied server-side) and clean the URL.
 */
export function OrderPlacedEffects({ reference }: { reference: string }) {
    const toast = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) {
            return;
        }

        hasRun.current = true;
        notifyCartUpdated();
        toast.success("Encomenda criada", { description: `Referência ${reference}` });
        router.replace(pathname, { scroll: false });
    }, [pathname, reference, router, toast]);

    return null;
}
