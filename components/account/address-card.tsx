"use client";

import { useState, useTransition } from "react";

import { AddressForm, type AddressValues } from "@/components/account/address-form";
import { useToast } from "@/components/ui/toast";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/account/actions";

export function AddressCard({ address }: { address: Required<Pick<AddressValues, "id">> & AddressValues }) {
    const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
    const [isPending, startTransition] = useTransition();
    const toast = useToast();

    function run(action: () => Promise<{ ok: boolean; message: string }>) {
        startTransition(async () => {
            const result = await action();
            (result.ok ? toast.success : toast.error)(result.message);
        });
    }

    if (mode === "edit") {
        return (
            <div className="rounded-3xl border border-wine/40 bg-surface p-5 shadow-card sm:p-6">
                <AddressForm address={address} onDone={() => setMode("view")} />
            </div>
        );
    }

    const linkButton =
        "rounded-sm text-sm font-semibold text-wine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-wine disabled:opacity-50";

    return (
        <article className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5" aria-busy={isPending}>
            <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-charcoal">{address.label || "Morada"}</h3>
                {address.isDefault && (
                    <span className="rounded-full bg-wine-light px-2.5 py-0.5 text-xs font-semibold text-wine">Principal</span>
                )}
            </div>
            <address className="mt-2 text-sm not-italic leading-6 text-charcoal">
                {address.recipientName} · {address.phone}
                <br />
                {address.addressLine1}
                {address.addressLine2 && `, ${address.addressLine2}`}
                <br />
                {address.postalCode} {address.city}
            </address>

            {mode === "confirm-delete" ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                    Eliminar esta morada?
                    <button type="button" disabled={isPending} onClick={() => run(() => deleteAddressAction(address.id))} className="font-semibold underline underline-offset-4">
                        Eliminar
                    </button>
                    <button type="button" onClick={() => setMode("view")} className="font-semibold text-charcoal">
                        Cancelar
                    </button>
                </div>
            ) : (
                <div className="mt-4 flex flex-wrap gap-4">
                    <button type="button" className={linkButton} onClick={() => setMode("edit")}>
                        Editar
                    </button>
                    {!address.isDefault && (
                        <button type="button" className={linkButton} disabled={isPending} onClick={() => run(() => setDefaultAddressAction(address.id))}>
                            Tornar principal
                        </button>
                    )}
                    <button type="button" className={linkButton} onClick={() => setMode("confirm-delete")}>
                        Eliminar
                    </button>
                </div>
            )}
        </article>
    );
}
