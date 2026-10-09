import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

export const services = [
    {
        icon: Truck,
        title: "Entrega especializada",
        description:
            "Entrega em Portugal Continental. Prazo e custo calculados no checkout.",
    },
    {
        icon: ShieldCheck,
        title: "Garantia legal de 3 anos",
        description: "Todos os equipamentos novos incluem garantia legal de 3 anos.",
    },
    {
        icon: RotateCcw,
        title: "14 dias para devolução",
        description: "Direito de livre resolução em compras online.",
    },
] as const;

export function ProductServices() {
    return (
        <ul role="list" className="divide-y divide-border rounded-3xl border border-charcoal/8 bg-surface">
            {services.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4 p-5">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-wine-light text-wine">
                        <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-charcoal">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
