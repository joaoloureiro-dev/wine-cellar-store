const steps = [
    {
        title: "Envie o pedido",
        description: "Indique os seus contactos e a quantidade pretendida.",
    },
    {
        title: "Confirmamos consigo",
        description: "Verificamos a disponibilidade e acordamos prazo e condições.",
    },
    {
        title: "Concluímos a compra",
        description: "Após a confirmação, combinamos o pagamento e a entrega.",
    },
] as const;

export function ReservationSteps() {
    return (
        <ol className="space-y-4">
            {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                    <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-champagne text-sm font-semibold text-charcoal"
                    >
                        {index + 1}
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-charcoal">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-6 text-muted">{step.description}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
