import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { reservationStatusTone, StatusBadge } from "@/components/account/status-badge";
import { reservationStatusLabels, type ReservationStatus } from "@/lib/reservations/status";

type ReservationRow = {
    reference: string;
    status: ReservationStatus;
    quantity: number;
    createdAt: Date;
    product: { name: string };
};

const date = new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeZone: "Europe/Lisbon" });

export function ReservationList({ reservations }: { reservations: ReservationRow[] }) {
    return (
        <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {reservations.map((reservation) => (
                <li key={reservation.reference}>
                    <Link
                        href={`/reservas/${reservation.reference}`}
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:p-5"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-sm font-semibold text-charcoal">{reservation.reference}</span>
                                <StatusBadge
                                    label={reservationStatusLabels[reservation.status]}
                                    tone={reservationStatusTone(reservation.status)}
                                />
                            </div>
                            <p className="mt-1 truncate text-sm text-muted">
                                {reservation.quantity}× {reservation.product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">{date.format(reservation.createdAt)}</p>
                        </div>
                        <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-muted" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}
