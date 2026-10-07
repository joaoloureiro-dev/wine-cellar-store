"use client";

import { useState, useTransition } from "react";

import { useToast } from "@/components/ui/toast";
import type { AdminActionResult } from "@/lib/admin/order-actions";
import { saveReservationNotesAction, transitionReservationAction } from "@/lib/admin/reservation-actions";
import { canTransition, type ReservationStatus } from "@/lib/reservations/status";

const primaryButton =
    "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-wine px-4 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60";
const inputClass =
    "mt-1.5 block w-full rounded-md border border-border bg-surface px-3 text-sm text-charcoal focus:border-wine focus:outline-2 focus:outline-wine/30";

const nextSteps: Partial<Record<ReservationStatus, { to: "AWAITING_PAYMENT" | "PAID"; label: string; hint: string }>> = {
    CONFIRMED: {
        to: "AWAITING_PAYMENT",
        label: "Pedir pagamento",
        hint: "Use depois de enviar ao cliente as instruções de pagamento.",
    },
    AWAITING_PAYMENT: {
        to: "PAID",
        label: "Marcar como paga",
        hint: "Confirme primeiro que o pagamento foi recebido.",
    },
};

function useRunner(reference: string) {
    const toast = useToast();
    const [isPending, startTransition] = useTransition();

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

    return { isPending, run };
}

export function ReservationActions({ reference, status }: { reference: string; status: ReservationStatus }) {
    const { isPending, run } = useRunner(reference);
    const [holdDays, setHoldDays] = useState("7");
    const [cancelOpen, setCancelOpen] = useState(false);
    const [reason, setReason] = useState("");

    const step = nextSteps[status];
    const canCancel = canTransition(status, "CANCELLED");

    if (status !== "PENDING" && !step && !canCancel) {
        return <p className="text-sm text-muted">Esta reserva está encerrada. Não há ações disponíveis.</p>;
    }

    return (
        <div className="space-y-5" aria-busy={isPending}>
            {status === "PENDING" && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        run(() => transitionReservationAction({ reference, to: "CONFIRMED", holdDays }));
                    }}
                >
                    <label htmlFor="hold-days" className="block text-sm font-medium text-charcoal">
                        Prazo da reserva (dias)
                    </label>
                    <input
                        id="hold-days"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={30}
                        required
                        value={holdDays}
                        onChange={(e) => setHoldDays(e.target.value)}
                        className={`${inputClass} h-11`}
                    />
                    <p className="mt-1.5 text-xs text-muted">
                        O stock fica reservado se estiver disponível. Depois do prazo a reserva expira automaticamente.
                    </p>
                    <button type="submit" disabled={isPending} className={`${primaryButton} mt-3`}>
                        Confirmar reserva
                    </button>
                </form>
            )}

            {step && (
                <div>
                    <p className="mb-3 text-xs text-muted">{step.hint}</p>
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => transitionReservationAction({ reference, to: step.to }))}
                        className={primaryButton}
                    >
                        {step.label}
                    </button>
                </div>
            )}

            {canCancel &&
                (cancelOpen ? (
                    <form
                        className="rounded-lg border border-danger/30 bg-danger/5 p-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            run(
                                () => transitionReservationAction({ reference, to: "CANCELLED", note: reason }),
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
                            className={`${inputClass} py-2`}
                        />
                        <div className="mt-3 flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="inline-flex min-h-10 items-center rounded-md bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Cancelar reserva
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
                        Cancelar reserva…
                    </button>
                ))}
        </div>
    );
}

export function ReservationNotesForm({ reference, notes }: { reference: string; notes: string | null }) {
    const { isPending, run } = useRunner(reference);
    const [value, setValue] = useState(notes ?? "");

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                run(() => saveReservationNotesAction({ reference, notes: value }));
            }}
        >
            <label htmlFor="internal-notes" className="sr-only">
                Notas internas
            </label>
            <textarea
                id="internal-notes"
                rows={4}
                maxLength={2000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Visíveis apenas no backoffice"
                className={`${inputClass} py-2`}
            />
            <button
                type="submit"
                disabled={isPending || value === (notes ?? "")}
                className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal disabled:opacity-50"
            >
                Guardar notas
            </button>
        </form>
    );
}
