"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useToast } from "@/components/ui/toast";

type PaymentStatusWatcherProps = {
    reference: string;
    initialPaymentStatus: string | null;
    initialOrderStatus: string;
};

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_DURATION_MS = 15 * 60 * 1000;

/**
 * Polls the order's payment status while it is pending and refreshes the
 * page when it changes. Confirmation always comes from the server (webhook),
 * never from the browser.
 */
export function PaymentStatusWatcher({
    reference,
    initialPaymentStatus,
    initialOrderStatus,
}: PaymentStatusWatcherProps) {
    const router = useRouter();
    const toast = useToast();
    const last = useRef({ payment: initialPaymentStatus, order: initialOrderStatus });

    useEffect(() => {
        const startedAt = Date.now();
        let stopped = false;

        const timer = window.setInterval(async () => {
            if (stopped || Date.now() - startedAt > MAX_POLL_DURATION_MS || document.hidden) {
                return;
            }

            try {
                const response = await fetch(`/api/orders/${reference}/payment-status`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    return;
                }

                const data = (await response.json()) as {
                    orderStatus: string;
                    paymentStatus: string | null;
                };

                if (data.paymentStatus === last.current.payment && data.orderStatus === last.current.order) {
                    return;
                }

                last.current = { payment: data.paymentStatus, order: data.orderStatus };

                if (data.paymentStatus === "PAID") {
                    toast.success("Pagamento confirmado", {
                        description: "Obrigado! Vamos preparar a sua encomenda.",
                    });
                    stopped = true;
                } else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") {
                    toast.error("Erro no pagamento", {
                        description: "O pagamento não foi concluído. Pode tentar novamente.",
                    });
                } else if (data.paymentStatus === "EXPIRED") {
                    toast.warning("Pedido de pagamento expirado", {
                        description: "Pode gerar um novo pedido de pagamento.",
                    });
                }

                router.refresh();
            } catch {
                // Network hiccup: try again on the next tick.
            }
        }, POLL_INTERVAL_MS);

        return () => {
            stopped = true;
            window.clearInterval(timer);
        };
    }, [reference, router, toast]);

    return null;
}
