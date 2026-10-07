"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, useEffect } from "react";

import { errorProps, Field, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { saveAddressAction, type AddressFormState } from "@/lib/account/actions";

export type AddressValues = {
    id?: string;
    label?: string | null;
    recipientName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    postalCode?: string;
    city?: string;
    isDefault?: boolean;
};

const initialState: AddressFormState = { status: "idle", submissionId: 0 };

export function AddressForm({ address, onDone }: { address?: AddressValues; onDone?: () => void }) {
    const [state, formAction, isPending] = useActionState(saveAddressAction, initialState);
    const toast = useToast();
    const errors = state.fieldErrors ?? {};
    const values = state.values ?? {
        label: address?.label ?? undefined,
        recipientName: address?.recipientName,
        phone: address?.phone,
        addressLine1: address?.addressLine1,
        addressLine2: address?.addressLine2 ?? undefined,
        postalCode: address?.postalCode,
        city: address?.city,
    };
    const prefix = address?.id ?? "new";

    useEffect(() => {
        if (state.submissionId === 0) {
            return;
        }

        if (state.status === "success") {
            toast.success(state.message ?? "Morada guardada");
            onDone?.();
        } else if (state.message) {
            toast.error("Não foi possível guardar a morada", { description: state.message });
        }
        // Only react to new submissions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submissionId]);

    const id = (name: string) => `${prefix}-${name}`;

    return (
        <form key={state.status === "success" ? `ok-${state.submissionId}` : `f-${state.submissionId}`} action={formAction} noValidate className="space-y-4">
            {address?.id && <input type="hidden" name="addressId" value={address.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome da morada (opcional)" name={id("label")} error={errors.label}>
                    <input id={id("label")} name="label" placeholder="Casa, Escritório…" maxLength={40} defaultValue={values.label} {...errorProps(id("label"), errors.label)} className={inputClassName} />
                </Field>
                <Field label="Destinatário" name={id("recipientName")} error={errors.recipientName}>
                    <input id={id("recipientName")} name="recipientName" autoComplete="name" maxLength={100} defaultValue={values.recipientName} {...errorProps(id("recipientName"), errors.recipientName)} className={inputClassName} />
                </Field>
            </div>
            <Field label="Telefone" name={id("phone")} error={errors.phone}>
                <input id={id("phone")} name="phone" type="tel" autoComplete="tel" maxLength={20} defaultValue={values.phone} {...errorProps(id("phone"), errors.phone)} className={`${inputClassName} sm:w-64`} />
            </Field>
            <Field label="Morada" name={id("addressLine1")} error={errors.addressLine1}>
                <input id={id("addressLine1")} name="addressLine1" autoComplete="address-line1" maxLength={120} defaultValue={values.addressLine1} {...errorProps(id("addressLine1"), errors.addressLine1)} className={inputClassName} />
            </Field>
            <Field label="Andar, porta, etc. (opcional)" name={id("addressLine2")} error={errors.addressLine2}>
                <input id={id("addressLine2")} name="addressLine2" autoComplete="address-line2" maxLength={120} defaultValue={values.addressLine2} {...errorProps(id("addressLine2"), errors.addressLine2)} className={inputClassName} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <Field label="Código postal" name={id("postalCode")} error={errors.postalCode}>
                    <input id={id("postalCode")} name="postalCode" autoComplete="postal-code" inputMode="numeric" placeholder="0000-000" maxLength={8} defaultValue={values.postalCode} {...errorProps(id("postalCode"), errors.postalCode)} className={inputClassName} />
                </Field>
                <Field label="Localidade" name={id("city")} error={errors.city}>
                    <input id={id("city")} name="city" autoComplete="address-level2" maxLength={60} defaultValue={values.city} {...errorProps(id("city"), errors.city)} className={inputClassName} />
                </Field>
            </div>
            {!address?.isDefault && (
                <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
                    <input type="checkbox" name="isDefault" className="size-4 cursor-pointer accent-wine" />
                    Usar como morada principal
                </label>
            )}
            {address?.isDefault && <input type="hidden" name="isDefault" value="on" />}
            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={isPending}
                    aria-busy={isPending}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:opacity-60"
                >
                    {isPending && <LoaderCircle size={16} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
                    Guardar morada
                </button>
                {onDone && address?.id && (
                    <button type="button" onClick={onDone} className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold text-charcoal hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-wine">
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}
