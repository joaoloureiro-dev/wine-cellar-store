import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

const services = [
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
        <ul role="list" className="divide-y divide-border rounded-xl border border-border bg-surface">
            {services.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-4 p-5">
                    <Icon
                        size={20}
                        strokeWidth={1.6}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-wine"
                    />
                    <div>
                        <p className="text-sm font-semibold text-charcoal">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}
