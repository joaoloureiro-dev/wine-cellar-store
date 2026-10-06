import { CopyButton } from "@/components/ui/copy-button";
import { formatCurrency } from "@/lib/format";

export type BankTransferInfo = {
    iban: string;
    bic?: string;
    holder: string;
    bank?: string;
};

type BankTransferDetailsProps = {
    details: BankTransferInfo;
    /** Known after the order is placed. */
    amountCents?: number;
    orderReference?: string;
};

export function BankTransferDetails({ details, amountCents, orderReference }: BankTransferDetailsProps) {
    const rows = [
        { label: "IBAN", value: details.iban, copy: true },
        ...(details.bic ? [{ label: "BIC/SWIFT", value: details.bic, copy: true }] : []),
        { label: "Titular", value: details.holder, copy: false },
        ...(details.bank ? [{ label: "Banco", value: details.bank, copy: false }] : []),
        ...(amountCents !== undefined
            ? [{ label: "Montante", value: formatCurrency(amountCents / 100), copy: false }]
            : []),
        ...(orderReference ? [{ label: "Descritivo", value: orderReference, copy: true }] : []),
    ];

    return (
        <div className="space-y-4">
            <ol className="space-y-2 text-sm leading-6 text-charcoal">
                <li className="flex gap-3">
                    <StepNumber>1</StepNumber>
                    <span>Aceda ao seu homebanking ou app do banco e escolha «Transferência».</span>
                </li>
                <li className="flex gap-3">
                    <StepNumber>2</StepNumber>
                    <span>
                        Use o IBAN e o titular abaixo e transfira o valor exato da encomenda.
                    </span>
                </li>
                <li className="flex gap-3">
                    <StepNumber>3</StepNumber>
                    <span>
                        No descritivo, indique a referência da encomenda
                        {orderReference ? (
                            <>
                                {" "}
                                <strong>{orderReference}</strong>
                            </>
                        ) : (
                            " (apresentada após confirmar a encomenda)"
                        )}
                        .
                    </span>
                </li>
                <li className="flex gap-3">
                    <StepNumber>4</StepNumber>
                    <span>
                        Confirmamos a receção (normalmente em 1 a 2 dias úteis) e preparamos o envio.
                    </span>
                </li>
            </ol>

            <dl className="divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <dt className="shrink-0 text-muted">{row.label}</dt>
                        <dd className="flex min-w-0 items-center gap-1 font-semibold text-charcoal">
                            <span className="break-all text-right">{row.value}</span>
                            {row.copy && <CopyButton value={row.value} label={row.label} />}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function StepNumber({ children }: { children: string }) {
    return (
        <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full border border-champagne text-xs font-semibold"
        >
            {children}
        </span>
    );
}
