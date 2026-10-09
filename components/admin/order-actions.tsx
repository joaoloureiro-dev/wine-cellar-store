"use client";

import { useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";
import { confirmBankTransferAction, transitionOrderAction, type AdminActionResult } from "@/lib/admin/order-actions";
import { canTransitionOrder, type OrderStatus } from "@/lib/orders/status";

type Step = {
    to: "PROCESSING" | "SHIPPED" | "DELIVERED";
    label: string;
    noteLabel?: string;
};

const nextSteps: Partial<Record<OrderStatus, Step>> = {
    PAID: { to: "PROCESSING", label: "Iniciar preparação" },
    PROCESSING: { to: "SHIPPED", label: "Marcar como enviada", noteLabel: "Transportadora e n.º de seguimento (opcional)" },
    SHIPPED: { to: "DELIVERED", label: "Marcar como entregue" },
};

const primaryButton =
    "inline-flex min-h-11 w-full items-center justify-center rounded-full bg-wine px-5 text-sm font-semibold text-white shadow-wine transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60";
const inputClass =
    "mt-1.5 block h-11 w-full rounded-3xl border border-charcoal/8 bg-surface shadow-card px-3.5 text-sm text-charcoal focus:border-wine focus:outline-2 focus:outline-wine/30";

export function OrderActions({
    reference,
    status,
    paymentMethod,
}: {
    reference: string;
    status: OrderStatus;
    paymentMethod: string;
}) {
    const toast = useToast();
    const [isPending, startTransition] = useTransition();
    const [note, setNote] = useState("");
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState("");

    const step = nextSteps[status];
    const canConfirmTransfer = status === "AWAITING_PAYMENT" && paymentMethod === "BANK_TRANSFER";
    const canCancel = canTransitionOrder(status, "CANCELLED");
    const needsRefund = status === "PAID" || status === "PROCESSING";

    function run(action: () => Promise<AdminActionResult>, onSuccess?: () => void) {
        startTransition(async () => {
            const result = await action();

            if (result.ok) {
                toast.success(result.message, { description: reference });
                onSuccess?.();
            } else {
                toast.error(result.message);
            }
        });
    }

    if (!step && !canConfirmTransfer && !canCancel) {
        return <p className="text-sm text-muted">Esta encomenda está concluída. Não há ações disponíveis.</p>;
    }

    return (
        <div className="space-y-5" aria-busy={isPending}>
            {canConfirmTransfer && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        run(() => confirmBankTransferAction({ reference, note }), () => setNote(""));
                    }}
                >
                    <p className="text-sm text-muted">
                        Confirme apenas depois de ver o valor creditado no extrato bancário.
                    </p>
                    <label htmlFor="transfer-note" className="mt-3 block text-sm font-medium text-charcoal">
                        Referência do movimento (opcional)
                    </label>
                    <input id="transfer-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={inputClass} />
                    <button type="submit" disabled={isPending} className={`${primaryButton} mt-3`}>
                        Confirmar transferência recebida
                    </button>
                </form>
            )}

            {step && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        run(() => transitionOrderAction({ reference, to: step.to, note }), () => setNote(""));
                    }}
                >
                    {step.noteLabel && (
                        <>
                            <label htmlFor="step-note" className="block text-sm font-medium text-charcoal">
                                {step.noteLabel}
                            </label>
                            <input id="step-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={`${inputClass} mb-3`} />
                        </>
                    )}
                    <button type="submit" disabled={isPending} className={primaryButton}>
                        {step.label}
                    </button>
                </form>
            )}

            {canCancel &&
                (cancelOpen ? (
                    <form
                        className="rounded-2xl border border-danger/30 bg-danger/5 p-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            run(
                                () => transitionOrderAction({ reference, to: "CANCELLED", note: reason }),
                                () => setCancelOpen(false),
                            );
                        }}
                    >
                        <label htmlFor="cancel-reason" className="block text-sm font-medium text-charcoal">
                            Motivo do cancelamento
                        </label>
                        <textarea
                            id="cancel-reason"
                            required
                            minLength={3}
                            maxLength={500}
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="mt-1.5 block w-full rounded-3xl border border-charcoal/8 bg-surface shadow-card px-3.5 py-2 text-sm text-charcoal focus:border-wine focus:outline-2 focus:outline-wine/30"
                        />
                        <p className="mt-2 text-xs text-muted">
                            O stock volta a ficar disponível.
                            {needsRefund && " A encomenda já foi paga: o reembolso é feito à parte."}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex min-h-10 items-center rounded-full bg-danger px-5 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Cancelar encomenda
                            </button>
                            <button type="button" onClick={() => setCancelOpen(false)} className="text-sm font-semibold text-charcoal">
                                Voltar
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        type="button"
                        onClick={() => setCancelOpen(true)}
                        className="text-sm font-semibold text-danger underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-wine"
                    >
                        Cancelar encomenda…
                    </button>
                ))}
        </div>
    );
}
