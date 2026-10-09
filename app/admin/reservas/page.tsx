import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { AccountHeading } from "@/components/account/account-heading";
import { reservationStatusTone, StatusBadge } from "@/components/account/status-badge";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { Pagination } from "@/components/admin/pagination";
import { requireAdmin } from "@/lib/admin/auth";
import { dateTime, shortDate } from "@/lib/admin/format";
import { parseListParams } from "@/lib/admin/list-params";
import { listAdminReservations } from "@/lib/admin/reservations";
import { reservationStatuses, reservationStatusLabels } from "@/lib/reservations/status";

export const metadata: Metadata = { title: "Reservas · Backoffice" };

const pathname = "/admin/reservas";
const statusOptions = reservationStatuses.map((value) => ({ value, label: reservationStatusLabels[value] }));

export default async function AdminReservationsPage({ searchParams }: PageProps<"/admin/reservas">) {
    await requireAdmin(pathname);
    const { status, q, page } = parseListParams(await searchParams, reservationStatuses);
    const { reservations, total, pageCount } = await listAdminReservations({ status, q, page });

    return (
        <>
            <AccountHeading title="Reservas" />
            <ListToolbar
                pathname={pathname}
                statuses={statusOptions}
                status={status}
                q={q}
                searchPlaceholder="Referência, nome ou email"
            />

            {reservations.length > 0 ? (
                <ul role="list" className="divide-y divide-border overflow-hidden rounded-3xl border border-charcoal/8 bg-surface shadow-card">
                    {reservations.map((reservation) => (
                        <li key={reservation.reference}>
                            <Link
                                href={`${pathname}/${reservation.reference}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 p-4 transition-colors hover:bg-surface-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-wine sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_auto_auto] sm:p-5"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span className="text-sm font-semibold text-charcoal">{reservation.reference}</span>
                                        <StatusBadge
                                            label={reservationStatusLabels[reservation.status]}
                                            tone={reservationStatusTone(reservation.status)}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted">
                                        {dateTime.format(reservation.createdAt)}
                                        {reservation.expiresAt &&
                                            (reservation.status === "CONFIRMED" || reservation.status === "AWAITING_PAYMENT") &&
                                            ` · expira ${shortDate.format(reservation.expiresAt)}`}
                                    </p>
                                </div>
                                <div className="col-start-1 row-start-2 min-w-0 sm:col-start-2 sm:row-start-1">
                                    <p className="truncate text-sm text-charcoal">{reservation.customerName}</p>
                                    <p className="truncate text-xs text-muted">{reservation.customerEmail}</p>
                                </div>
                                <span className="row-span-2 max-w-[9rem] text-right text-sm font-semibold text-charcoal sm:row-span-1 sm:max-w-none">
                                    {reservation.quantity}× <span className="font-normal">{reservation.product.name}</span>
                                </span>
                                <ChevronRight size={18} strokeWidth={1.6} aria-hidden="true" className="hidden text-muted sm:block" />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface p-8 text-center text-sm text-muted">
                    Nenhuma reserva encontrada com estes filtros.
                </p>
            )}

            <Pagination pathname={pathname} page={page} pageCount={pageCount} total={total} status={status} q={q} />
        </>
    );
}
