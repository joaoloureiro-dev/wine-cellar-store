import { CircleCheck, Clock, CreditCard, LoaderCircle, Smartphone, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { BankTransferDetails, type BankTransferInfo } from "@/components/payments/bank-transfer-details";
import { PaymentStatusWatcher } from "@/components/payments/payment-status-watcher";
import { RetryPaymentButton } from "@/components/payments/retry-payment-button";
import { CopyButton } from "@/components/ui/copy-button";
import { formatCurrency } from "@/lib/format";
import type { getOrderPaymentView } from "@/lib/payments/service";

type PaymentView = NonNullable<Awaited<ReturnType<typeof getOrderPaymentView>>>;

type PaymentInstructionsProps = {
    reference: string;
    view: PaymentView;
    bankTransfer: BankTransferInfo | null;
    /** `?pagamento=` value after returning from a hosted payment page. */
    returnState?: string;
};

const dateTime = new Intl.DateTimeFormat("pt-PT", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Lisbon",
});

const time = new Intl.DateTimeFormat("pt-PT", { timeStyle: "short", timeZone: "Europe/Lisbon" });

function formatMbReference(reference: string) {
    return reference.replace(/\D/g, "").replace(/(\d{3})(?=\d)/g, "$1 ");
}

export function PaymentInstructions({ reference, view, bankTransfer, returnState }: PaymentInstructionsProps) {
    const { orderStatus, method, payment, totalCents, paymentDueAt } = view;
    const isAwaiting = orderStatus === "AWAITING_PAYMENT";
    const isPending = isAwaiting && payment?.status === "PENDING";

    const watcher = isPending ? (
        <PaymentStatusWatcher
            reference={reference}
            initialPaymentStatus={payment?.status ?? null}
            initialOrderStatus={orderStatus}
        />
    ) : null;

    if (!isAwaiting) {
        if (orderStatus === "EXPIRED" || orderStatus === "CANCELLED") {
            return (
                <Panel tone="warning" icon={TriangleAlert} title={orderStatus === "EXPIRED" ? "Encomenda expirada" : "Encomenda cancelada"}>
                    O prazo de pagamento terminou ou a encomenda foi cancelada, e os artigos
                    voltaram a ficar disponíveis. Se já efetuou o pagamento, contacte-nos.
                </Panel>
            );
        }

        return (
            <Panel tone="success" icon={CircleCheck} title="Pagamento confirmado">
                Recebemos o seu pagamento. Vamos preparar a encomenda e agendar a entrega consigo.
            </Panel>
        );
    }

    const deadline = (
        <p className="mt-3 text-xs text-muted">
            Conclua o pagamento até <strong className="text-charcoal">{dateTime.format(paymentDueAt)}</strong>;
            depois dessa data a reserva dos artigos é libertada.
        </p>
    );

    if (!payment || payment.status === "FAILED") {
        return (
            <Panel tone="warning" icon={TriangleAlert} title="Não foi possível gerar o pagamento">
                Ocorreu um problema ao comunicar com o serviço de pagamentos. Os artigos continuam
                reservados para si.
                <div className="mt-4">
                    <RetryPaymentButton reference={reference} label="Gerar pagamento" />
                </div>
                {deadline}
            </Panel>
        );
    }

    switch (method) {
        case "MBWAY":
            return payment.status === "PENDING" ? (
                <Panel tone="info" icon={Smartphone} title="Confirme o pagamento na app MB WAY">
                    Enviámos um pedido de pagamento de{" "}
                    <strong className="text-charcoal">{formatCurrency(totalCents / 100)}</strong> para o
                    telemóvel indicado. Abra a app MB WAY e aceite o pedido
                    {payment.expiresAt ? <> até às <strong className="text-charcoal">{time.format(payment.expiresAt)}</strong></> : null}.
                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-charcoal">
                        <LoaderCircle size={14} strokeWidth={1.8} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                        A aguardar confirmação…
                    </p>
                    {watcher}
                </Panel>
            ) : (
                <Panel tone="warning" icon={TriangleAlert} title="O pedido MB WAY expirou ou foi recusado">
                    Pode enviar um novo pedido para o mesmo número.
                    <div className="mt-4">
                        <RetryPaymentButton reference={reference} label="Reenviar pedido MB WAY" />
                    </div>
                    {deadline}
                </Panel>
            );

        case "MULTIBANCO":
            return payment.status === "PENDING" && payment.mbEntity && payment.mbReference ? (
                <Panel tone="info" icon={CreditCard} title="Pague por Multibanco">
                    Use estes dados no homebanking, na app do seu banco ou numa caixa Multibanco
                    («Pagamentos de serviços»).
                    <dl className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                        <Row label="Entidade" value={payment.mbEntity} copyLabel="Entidade" />
                        <Row label="Referência" value={formatMbReference(payment.mbReference)} copyLabel="Referência" />
                        <Row label="Montante" value={formatCurrency(totalCents / 100)} />
                    </dl>
                    {deadline}
                    {watcher}
                </Panel>
            ) : (
                <Panel tone="warning" icon={TriangleAlert} title="A referência Multibanco expirou">
                    <div className="mt-2">
                        <RetryPaymentButton reference={reference} label="Gerar nova referência" />
                    </div>
                    {deadline}
                </Panel>
            );

        case "BANK_TRANSFER":
            return (
                <Panel tone="info" icon={Clock} title="Pague por transferência bancária">
                    {bankTransfer ? (
                        <div className="mt-3">
                            <BankTransferDetails details={bankTransfer} amountCents={totalCents} orderReference={reference} />
                        </div>
                    ) : (
                        "Os dados para transferência serão enviados por email."
                    )}
                    {deadline}
                </Panel>
            );

        case "KLARNA": {
            if (payment.status === "PENDING" && returnState === "klarna") {
                return (
                    <Panel tone="info" icon={LoaderCircle} title="A confirmar o pagamento com a Klarna">
                        Assim que a Klarna confirmar, esta página é atualizada automaticamente.
                        {watcher}
                    </Panel>
                );
            }

            if (payment.status === "PENDING" && payment.checkoutUrl) {
                return (
                    <Panel tone="info" icon={CreditCard} title="Conclua o pagamento com a Klarna">
                        {returnState === "cancelado" && <>O pagamento na Klarna foi interrompido. </>}
                        Pode continuar onde ficou.
                        <div className="mt-4">
                            <a
                                href={payment.checkoutUrl}
                                className="inline-flex min-h-11 items-center justify-center rounded-md bg-wine px-5 text-sm font-semibold text-white transition-colors hover:bg-wine-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine"
                            >
                                Continuar na Klarna
                            </a>
                        </div>
                        {deadline}
                        {watcher}
                    </Panel>
                );
            }

            return (
                <Panel tone="warning" icon={TriangleAlert} title="O pagamento com a Klarna não foi concluído">
                    <div className="mt-2">
                        <RetryPaymentButton reference={reference} label="Tentar novamente com a Klarna" />
                    </div>
                    {deadline}
                </Panel>
            );
        }
    }
}

const tones = {
    info: "border-champagne/60",
    success: "border-success/40 bg-success/5",
    warning: "border-warning/40 bg-warning/5",
} as const;

const iconTones = { info: "text-wine", success: "text-success", warning: "text-warning" } as const;

function Panel({
    tone,
    icon: Icon,
    title,
    children,
}: {
    tone: keyof typeof tones;
    icon: typeof Clock;
    title: string;
    children: ReactNode;
}) {
    return (
        <section aria-labelledby="payment-heading" className={`rounded-xl border bg-surface p-5 sm:p-6 ${tones[tone]}`}>
            <h2 id="payment-heading" className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                <Icon size={18} strokeWidth={1.8} aria-hidden="true" className={iconTones[tone]} />
                {title}
            </h2>
            <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
        </section>
    );
}

function Row({ label, value, copyLabel }: { label: string; value: string; copyLabel?: string }) {
    return (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd className="flex items-center gap-1 font-semibold tracking-wide text-charcoal">
                {value}
                {copyLabel && <CopyButton value={value} label={copyLabel} />}
            </dd>
        </div>
    );
}
