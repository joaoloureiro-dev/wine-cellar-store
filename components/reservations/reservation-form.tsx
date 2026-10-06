"use client";

import { CalendarClock, LoaderCircle } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { Field, FieldError, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import {
    createReservationAction,
    type ReservationFormState,
} from "@/lib/reservations/actions";
import { MAX_RESERVATION_QUANTITY } from "@/lib/reservations/schema";

type ReservationFormProps = {
    productId: string;
};

const initialState: ReservationFormState = { status: "idle", submissionId: 0 };

/**
 * Progressive enhancement: the form posts to a Server Action and works
 * without JavaScript. With JS, errors render inline and as a toast.
 */
export function ReservationForm({ productId }: ReservationFormProps) {
    const [state, formAction, isPending] = useActionState(
        createReservationAction,
        initialState,
    );
    const toast = useToast();
    const errorToastId = useRef<number | null>(null);
    const errors = state.fieldErrors ?? {};
    const values = state.values ?? {};

    useEffect(() => {
        if (state.status === "error" && state.message) {
            errorToastId.current = toast.error("Não foi possível criar a reserva", {
                description: state.message,
            });
        }
        // Only react to new submissions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.submissionId]);

    return (
        <form
            key={state.submissionId}
            action={formAction}
            onSubmit={() => {
                // A previous error no longer applies to this new attempt.
                if (errorToastId.current !== null) {
                    toast.dismiss(errorToastId.current);
                }
            }}
            noValidate
            aria-describedby={state.message ? "reservation-form-message" : undefined}
            className="space-y-5"
        >
            <input type="hidden" name="productId" value={productId} />

            {state.status === "error" && state.message && (
                <p
                    id="reservation-form-message"
                    role="alert"
                    className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
                >
                    {state.message}
                </p>
            )}

            <Field label="Nome completo" name="name" error={errors.name}>
                <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    defaultValue={values.name}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    className={inputClassName}
                />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email" name="email" error={errors.email}>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        defaultValue={values.email}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={inputClassName}
                    />
                </Field>

                <Field label="Telefone" name="phone" error={errors.phone}>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        maxLength={20}
                        defaultValue={values.phone}
                        aria-invalid={errors.phone ? true : undefined}
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                        className={inputClassName}
                    />
                </Field>
            </div>

            <Field label="Quantidade" name="quantity" error={errors.quantity}>
                <select
                    id="quantity"
                    name="quantity"
                    defaultValue={values.quantity ?? "1"}
                    aria-invalid={errors.quantity ? true : undefined}
                    aria-describedby={errors.quantity ? "quantity-error" : undefined}
                    className={`${inputClassName} sm:w-32`}
                >
                    {Array.from({ length: MAX_RESERVATION_QUANTITY }, (_, index) => index + 1).map(
                        (value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ),
                    )}
                </select>
            </Field>

            <Field label="Notas (opcional)" name="notes" error={errors.notes}>
                <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    maxLength={500}
                    defaultValue={values.notes}
                    placeholder="Ex.: preferência de contacto, prazo pretendido, local de instalação…"
                    aria-invalid={errors.notes ? true : undefined}
                    aria-describedby={errors.notes ? "notes-error" : undefined}
                    className={`${inputClassName} h-auto py-3`}
                />
            </Field>

            {/* Honeypot for bots: hidden from people and assistive technology. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                    Website
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </label>
            </div>

            <div>
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-charcoal">
                    <input
                        type="checkbox"
                        name="privacyConsent"
                        required
                        aria-invalid={errors.privacyConsent ? true : undefined}
                        aria-describedby={
                            errors.privacyConsent ? "privacyConsent-error" : undefined
                        }
                        className="mt-1 size-4 shrink-0 cursor-pointer accent-wine"
                    />
                    <span>
                        Aceito que os meus dados (nome, email e telefone) sejam usados
                        exclusivamente para gerir este pedido de reserva.
                    </span>
                </label>
                <FieldError name="privacyConsent" error={errors.privacyConsent} />
            </div>

            <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? (
                    <LoaderCircle
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                        className="animate-spin motion-reduce:animate-none"
                    />
                ) : (
                    <CalendarClock size={18} strokeWidth={1.8} aria-hidden="true" />
                )}
                Enviar pedido de reserva
            </button>

            <p className="text-center text-xs leading-5 text-muted">
                Sem pagamento nesta fase. Confirmamos a disponibilidade e as condições
                consigo.
            </p>
        </form>
    );
}
