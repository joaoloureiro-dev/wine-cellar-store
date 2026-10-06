"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";

/** Shows a one-off "reservation created" toast and cleans the URL. */
export function ReservationCreatedToast({ reference }: { reference: string }) {
    const toast = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const hasShown = useRef(false);

    useEffect(() => {
        if (hasShown.current) {
            return;
        }

        hasShown.current = true;
        toast.success("Reserva criada", { description: `Referência ${reference}` });
        router.replace(pathname, { scroll: false });
    }, [pathname, reference, router, toast]);

    return null;
}
