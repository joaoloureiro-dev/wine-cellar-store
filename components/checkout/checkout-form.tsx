"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Lock } from "lucide-react";
import {
    useActionState,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from "react";

import { BankTransferDetails, type BankTransferInfo } from "@/components/payments/bank-transfer-details";
import { errorProps, Field, FieldError, inputClassName } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import { placeOrderAction, type CheckoutFormState, type CheckoutFormValues } from "@/lib/checkout/actions";
import { getPaymentMethodLabel, paymentMethods, type PaymentMethodId } from "@/lib/checkout/payment-methods";
import {
    checkoutSchema,
    checkoutSteps,
    getMbWayPhoneError,
    type CheckoutField,
    type CheckoutStepId,
} from "@/lib/checkout/schema";
import { formatCurrency } from "@/lib/format";

export type ShippingOption = {
    id: string;
    label: string;
    description: string;
    priceCents: number;
};

type CheckoutFormProps = {
    idempotencyKey: string;
    shippingOptions: ShippingOption[];
    /** Methods whose provider is configured and that accept this amount. */
    availablePaymentMethods: PaymentMethodId[];
    bankTransfer: BankTransferInfo | null;
    /** Prefilled from the customer's account and default address. */
    defaults?: CheckoutFormValues;
    isSignedIn: boolean;
};

type FieldErrors = Partial<Record<CheckoutField, string>>;

const initialState: CheckoutFormState = { status: "idle", submissionId: 0 };

const subscribeNoop = () => () => {};

const stepPillClassName =
    "inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition-colors focus-visible:outline-2 focus-visible:outline-wine";

/**
 * Multi-step checkout.
 *
 * Progressive enhancement: without JavaScript every step is visible and the
 * form submits once. With JavaScript, steps are shown one at a time and each
 * is validated in the browser with the same Zod schema the server uses. The
 * server always re-validates everything.
 */
export function CheckoutForm(props: CheckoutFormProps) {
    const [state, formAction, isPending] = useActionState(placeOrderAction, initialState);

    return (
        <CheckoutSteps
            // Remount after each submission so inputs pick up echoed values.
            key={state.submissionId}
            state={state}
            formAction={formAction}
            isPending={isPending}
            {...props}
        />
    );
}

type CheckoutStepsProps = CheckoutFormProps & {
    state: CheckoutFormState;
    formAction: (formData: FormData) => void;
    isPending: boolean;
};

function CheckoutSteps({
    state,
    formAction,
    isPending,
    idempotencyKey,
    shippingOptions,
    availablePaymentMethods,
    bankTransfer,
    defaults,
    isSignedIn,
}: CheckoutStepsProps) {
    const isEnhanced = useSyncExternalStore(subscribeNoop, () => true, () => false);
    const toast = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const headingRefs = useRef<Partial<Record<CheckoutStepId, HTMLHeadingElement | null>>>({});
    const hasNavigated = useRef(false);

    const [currentStep, setCurrentStep] = useState<CheckoutStepId>(state.step ?? "customer");
    const [errors, setErrors] = useState<FieldErrors>(state.fieldErrors ?? {});
    const values = state.values ?? defaults ?? {};
    const [review, setReview] = useState<Record<string, string | undefined>>(values);
    const currentIndex = checkoutSteps.findIndex((step) => step.id === currentStep);

    useEffect(() => {
        if (state.status === "error" && state.message) {
            toast.error("Não foi possível concluir a encomenda", {
                description: state.message,
                action: state.actionHref
                    ? { label: "Rever carrinho", href: state.actionHref }
                    : undefined,
            });
        }
        // Runs once per submission (this component remounts per submission).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Move focus to the new step's heading for keyboard and screen reader users.
    useEffect(() => {
        if (!hasNavigated.current) {
            return;
        }

        headingRefs.current[currentStep]?.focus();
    }, [currentStep]);

    function readValues() {
        const formData = new FormData(formRef.current ?? undefined);

        return Object.fromEntries(
            [...formData.entries()].filter(
                (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
        );
    }

    function validateStep(stepId: CheckoutStepId) {
        const step = checkoutSteps.find((item) => item.id === stepId)!;
        const mask = Object.fromEntries(step.fields.map((field) => [field, true])) as {
            [K in CheckoutField]?: true;
        };
        const values = readValues();
        const result = checkoutSchema.pick(mask).safeParse(values);
        const stepErrors: FieldErrors = {};

        if (!result.success) {
            for (const issue of result.error.issues) {
                const field = issue.path[0] as CheckoutField;
                stepErrors[field] ??= issue.message;
            }
        }

        if (stepId === "payment") {
            const mbWayError = getMbWayPhoneError(values.paymentMethod, values.phone);

            if (mbWayError) {
                stepErrors.paymentMethod = mbWayError;
            }
        }

        setErrors((current) => {
            const next = { ...current };
            for (const field of step.fields) {
                delete next[field];
            }
            return { ...next, ...stepErrors };
        });

        return Object.keys(stepErrors).length === 0;
    }

    function goTo(stepId: CheckoutStepId) {
        hasNavigated.current = true;

        if (stepId === "review") {
            setReview(readValues());
        }

        setCurrentStep(stepId);
    }

    function goNext() {
        if (!validateStep(currentStep)) {
            return;
        }

        goTo(checkoutSteps[currentIndex + 1].id);
    }

    function isStepVisible(stepId: CheckoutStepId) {
        return !isEnhanced || stepId === currentStep;
    }

    const selectedShipping = shippingOptions.find(
        (option) => option.id === (review.shippingMethod ?? values.shippingMethod),
    );

    return (
        <form
            ref={formRef}
            action={formAction}
            noValidate
            onSubmit={(event) => {
                if (isEnhanced && !validateStep("review")) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

            {isEnhanced && (
                <nav aria-label="Passos do checkout" className="mb-8">
                    {/* Mobile: compact progress instead of a horizontal list. */}
                    <div className="sm:hidden">
                        <p className="text-xs font-semibold text-charcoal">
                            Passo {currentIndex + 1} de {checkoutSteps.length}
                            <span className="text-muted"> · {checkoutSteps[currentIndex].label}</span>
                        </p>
                        <div aria-hidden="true" className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                            <div
                                className="h-full rounded-full bg-wine transition-[width] duration-300 motion-reduce:transition-none"
                                style={{ width: `${((currentIndex + 1) / checkoutSteps.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <ol className="relative hidden flex-wrap items-center gap-3 text-xs font-semibold sm:flex">
                        {checkoutSteps.map((step, index) => {
                            const isCurrent = step.id === currentStep;
                            const isDone = index < currentIndex;

                            return (
                                <li key={step.id} className="flex shrink-0 items-center gap-3">
                                    {isDone ? (
                                        <button
                                            type="button"
                                            onClick={() => goTo(step.id)}
                                            className={`${stepPillClassName} text-charcoal hover:bg-surface-muted`}
                                        >
                                            <span className="flex size-6 items-center justify-center rounded-full bg-wine text-white">
                                                <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                                            </span>
                                            {step.label}
                                            <span className="sr-only"> (concluído)</span>
                                        </button>
                                    ) : (
                                        <span
                                            aria-current={isCurrent ? "step" : undefined}
                                            className={`${stepPillClassName} ${
                                                isCurrent ? "bg-charcoal text-white" : "text-muted"
                                            }`}
                                        >
                                            <span
                                                className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                                                    isCurrent ? "bg-white text-charcoal" : "border border-border"
                                                }`}
                                            >
                                                {index + 1}
                                            </span>
                                            {step.label}
                                        </span>
                                    )}
                                    {index < checkoutSteps.length - 1 && (
                                        <span aria-hidden="true" className="h-px w-6 bg-border" />
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            )}

            {state.status === "error" && state.message && (
                <div
                    role="alert"
                    className="mb-6 rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
                >
                    {state.message}
                    {state.actionHref && (
                        <>
                            {" "}
                            <Link href={state.actionHref} className="underline underline-offset-4">
                                Rever carrinho
                            </Link>
                        </>
                    )}
                </div>
            )}

            <div className="space-y-10">
                <Step
                    id="customer"
                    title="Os seus dados"
                    visible={isStepVisible("customer")}
                    headingRef={(element) => (headingRefs.current.customer = element)}
                >
                    {!isSignedIn && (
                        <p className="text-sm text-muted">
                            Já tem conta?{" "}
                            <Link href="/entrar?next=%2Fcheckout" className="font-semibold text-wine underline underline-offset-4">
                                Entrar
                            </Link>{" "}
                            para preencher os seus dados. Também pode continuar sem conta.
                        </p>
                    )}
                    <Field label="Nome completo" name="name" error={errors.name}>
                        <input id="name" name="name" type="text" autoComplete="name" required maxLength={100} defaultValue={values.name} {...errorProps("name", errors.name)} className={inputClassName} />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Email" name="email" error={errors.email}>
                            <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={values.email} {...errorProps("email", errors.email)} className={inputClassName} />
                        </Field>
                        <Field label="Telefone" name="phone" error={errors.phone}>
                            <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={20} defaultValue={values.phone} {...errorProps("phone", errors.phone)} className={inputClassName} />
                        </Field>
                    </div>
                    <Field label="NIF (opcional)" name="taxId" hint="Para a fatura com número de contribuinte." error={errors.taxId}>
                        <input id="taxId" name="taxId" type="text" inputMode="numeric" autoComplete="off" maxLength={11} defaultValue={values.taxId} {...errorProps("taxId", errors.taxId)} className={`${inputClassName} sm:w-56`} />
                    </Field>
                </Step>

                <Step
                    id="address"
                    title="Morada de entrega"
                    visible={isStepVisible("address")}
                    headingRef={(element) => (headingRefs.current.address = element)}
                >
                    <p className="text-sm text-muted">Entregamos em Portugal Continental.</p>
                    <Field label="Morada" name="addressLine1" error={errors.addressLine1}>
                        <input id="addressLine1" name="addressLine1" type="text" autoComplete="address-line1" required maxLength={120} defaultValue={values.addressLine1} {...errorProps("addressLine1", errors.addressLine1)} className={inputClassName} />
                    </Field>
                    <Field label="Andar, porta, etc. (opcional)" name="addressLine2" error={errors.addressLine2}>
                        <input id="addressLine2" name="addressLine2" type="text" autoComplete="address-line2" maxLength={120} defaultValue={values.addressLine2} {...errorProps("addressLine2", errors.addressLine2)} className={inputClassName} />
                    </Field>
                    <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                        <Field label="Código postal" name="postalCode" error={errors.postalCode}>
                            <input id="postalCode" name="postalCode" type="text" autoComplete="postal-code" inputMode="numeric" placeholder="0000-000" required maxLength={8} defaultValue={values.postalCode} {...errorProps("postalCode", errors.postalCode)} className={inputClassName} />
                        </Field>
                        <Field label="Localidade" name="city" error={errors.city}>
                            <input id="city" name="city" type="text" autoComplete="address-level2" required maxLength={60} defaultValue={values.city} {...errorProps("city", errors.city)} className={inputClassName} />
                        </Field>
                    </div>
                    {isSignedIn && (
                        <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
                            <input type="checkbox" name="saveAddress" className="size-4 cursor-pointer accent-wine" />
                            Guardar esta morada na minha conta
                        </label>
                    )}
                </Step>

                <Step
                    id="delivery"
                    title="Entrega"
                    visible={isStepVisible("delivery")}
                    headingRef={(element) => (headingRefs.current.delivery = element)}
                >
                    <fieldset>
                        <legend className="sr-only">Método de entrega</legend>
                        <div className="space-y-3">
                            {shippingOptions.map((option, index) => (
                                <OptionCard
                                    key={option.id}
                                    name="shippingMethod"
                                    value={option.id}
                                    defaultChecked={(values.shippingMethod ?? (index === 0 ? option.id : undefined)) === option.id}
                                    title={option.label}
                                    description={option.description}
                                    aside={option.priceCents === 0 ? "Grátis" : formatCurrency(option.priceCents / 100)}
                                />
                            ))}
                        </div>
                        <FieldError name="shippingMethod" error={errors.shippingMethod} />
                    </fieldset>
                    <Field label="Notas para a entrega (opcional)" name="customerNotes" error={errors.customerNotes}>
                        <textarea id="customerNotes" name="customerNotes" rows={3} maxLength={500} defaultValue={values.customerNotes} placeholder="Ex.: acesso ao edifício, horário preferido…" {...errorProps("customerNotes", errors.customerNotes)} className={`${inputClassName} h-auto py-3`} />
                    </Field>
                </Step>

                <Step
                    id="payment"
                    title="Pagamento"
                    visible={isStepVisible("payment")}
                    headingRef={(element) => (headingRefs.current.payment = element)}
                >
                    <fieldset>
                        <legend className="sr-only">Método de pagamento</legend>
                        <div className="space-y-3">
                            {paymentMethods
                                .filter((method) => availablePaymentMethods.includes(method.id))
                                .map((method) => (
                                    <OptionCard
                                        key={method.id}
                                        name="paymentMethod"
                                        value={method.id}
                                        defaultChecked={values.paymentMethod === method.id}
                                        title={method.label}
                                        description={method.description}
                                        details={
                                            method.id === "BANK_TRANSFER" && bankTransfer ? (
                                                <BankTransferDetails details={bankTransfer} />
                                            ) : undefined
                                        }
                                    />
                                ))}
                        </div>
                        <FieldError name="paymentMethod" error={errors.paymentMethod} />
                    </fieldset>
                    <p className="flex items-center gap-2 text-xs text-muted">
                        <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
                        O pagamento só é considerado concluído após confirmação do banco.
                    </p>
                </Step>

                <Step
                    id="review"
                    title="Revisão"
                    visible={isStepVisible("review")}
                    headingRef={(element) => (headingRefs.current.review = element)}
                >
                    {isEnhanced && (
                        <dl className="divide-y divide-border rounded-xl border border-border bg-surface text-sm">
                            <ReviewRow label="Dados" onEdit={() => goTo("customer")}>
                                {review.name}
                                <br />
                                {review.email} · {review.phone}
                                {review.taxId && (
                                    <>
                                        <br />
                                        NIF {review.taxId}
                                    </>
                                )}
                            </ReviewRow>
                            <ReviewRow label="Morada" onEdit={() => goTo("address")}>
                                {review.addressLine1}
                                {review.addressLine2 && `, ${review.addressLine2}`}
                                <br />
                                {review.postalCode} {review.city}
                            </ReviewRow>
                            <ReviewRow label="Entrega" onEdit={() => goTo("delivery")}>
                                {selectedShipping?.label}
                                {review.customerNotes && (
                                    <>
                                        <br />
                                        <span className="text-muted">{review.customerNotes}</span>
                                    </>
                                )}
                            </ReviewRow>
                            <ReviewRow label="Pagamento" onEdit={() => goTo("payment")}>
                                {review.paymentMethod &&
                                    getPaymentMethodLabel(review.paymentMethod as PaymentMethodId)}
                            </ReviewRow>
                        </dl>
                    )}

                    <div>
                        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-charcoal">
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                required
                                {...errorProps("termsAccepted", errors.termsAccepted)}
                                className="mt-1 size-4 shrink-0 cursor-pointer accent-wine"
                            />
                            <span>
                                Confirmo que os dados estão corretos e aceito os{" "}
                                <Link href="/termos" target="_blank" className="font-semibold text-wine underline underline-offset-4">
                                    Termos e Condições
                                </Link>
                                . Os dados são tratados conforme a{" "}
                                <Link href="/privacidade" target="_blank" className="font-semibold text-wine underline underline-offset-4">
                                    Política de Privacidade
                                </Link>
                                .
                            </span>
                        </label>
                        <FieldError name="termsAccepted" error={errors.termsAccepted} />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        aria-busy={isPending}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? (
                            <LoaderCircle size={18} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                        ) : (
                            <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
                        )}
                        Confirmar encomenda
                    </button>
                </Step>
            </div>

            {isEnhanced && currentStep !== "review" && (
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    {currentIndex > 0 ? (
                        <button
                            type="button"
                            onClick={() => goTo(checkoutSteps[currentIndex - 1].id)}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                        >
                            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
                            Voltar
                        </button>
                    ) : (
                        <Link
                            href="/carrinho"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border px-5 text-sm font-semibold text-charcoal transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                        >
                            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
                            Carrinho
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-charcoal px-6 text-sm font-semibold text-white transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                    >
                        Continuar
                        <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                </div>
            )}

            {isEnhanced && currentStep === "review" && (
                <button
                    type="button"
                    onClick={() => goTo("payment")}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-semibold text-muted hover:text-charcoal focus-visible:outline-2 focus-visible:outline-wine"
                >
                    <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
                    Voltar ao pagamento
                </button>
            )}
        </form>
    );
}

type StepProps = {
    id: CheckoutStepId;
    title: string;
    visible: boolean;
    headingRef: (element: HTMLHeadingElement | null) => void;
    children: ReactNode;
};

function Step({ id, title, visible, headingRef, children }: StepProps) {
    const index = checkoutSteps.findIndex((step) => step.id === id);

    return (
        <section hidden={!visible} aria-labelledby={`step-${id}`} className="space-y-5">
            <h2
                id={`step-${id}`}
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-3xl font-medium tracking-[-0.02em] text-charcoal outline-none"
            >
                <span className="mr-2 text-champagne">{index + 1}.</span>
                {title}
            </h2>
            {children}
        </section>
    );
}

type OptionCardProps = {
    name: string;
    value: string;
    defaultChecked: boolean;
    title: string;
    description: string;
    aside?: string;
    /** Shown below the option while it is selected (pure CSS, works without JS). */
    details?: ReactNode;
};

function OptionCard({ name, value, defaultChecked, title, description, aside, details }: OptionCardProps) {
    return (
        <div className="group">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-charcoal/40 has-checked:border-wine has-checked:bg-wine-light/30 has-focus-visible:outline-2 has-focus-visible:outline-wine">
                <input
                    type="radio"
                    name={name}
                    value={value}
                    defaultChecked={defaultChecked}
                    required
                    className="mt-0.5 size-4 shrink-0 cursor-pointer accent-wine"
                />
                <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-semibold text-charcoal">{title}</span>
                        {aside && <span className="text-sm font-semibold text-charcoal">{aside}</span>}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
                </span>
            </label>
            {details && (
                <div className="mt-2 hidden rounded-lg border border-border bg-background p-4 group-has-checked:block">
                    {details}
                </div>
            )}
        </div>
    );
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit: () => void; children: ReactNode }) {
    return (
        <div className="flex gap-4 p-4 sm:p-5">
            <dt className="w-24 shrink-0 font-semibold text-charcoal">{label}</dt>
            <dd className="min-w-0 flex-1 break-words text-charcoal">{children}</dd>
            <dd className="shrink-0">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-sm text-xs font-semibold text-wine underline underline-offset-4 hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine"
                >
                    Alterar<span className="sr-only"> {label.toLowerCase()}</span>
                </button>
            </dd>
        </div>
    );
}
