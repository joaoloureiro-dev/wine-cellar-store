import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { reservationStatusTone, StatusBadge } from "@/components/account/status-badge";
import { Panel, Timeline } from "@/components/admin/panel";
import { ReservationActions, ReservationNotesForm } from "@/components/admin/reservation-actions";
import { requireAdmin } from "@/lib/admin/auth";
import { actorLabels, dateTime } from "@/lib/admin/format";
import { getAdminReservation } from "@/lib/admin/reservations";
import { formatCurrency } from "@/lib/format";
import { openReservationStatuses, reservationStatusLabels, type ReservationStatus } from "@/lib/reservations/status";

export const metadata: Metadata = { title: "Reserva · Backoffice" };

const isOpen = (status: ReservationStatus) => (openReservationStatuses as readonly ReservationStatus[]).includes(status);

export default async function AdminReservationPage({ params }: PageProps<"/admin/reservas/[reference]">) {
    const { reference } = await params;
    await requireAdmin(`/admin/reservas/${reference}`);
    const reservation = await getAdminReservation(reference);

    if (!reservation) {
        notFound();
    }

    const { product } = reservation;

    return (
        <>
            <Link href="/admin/reservas" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-wine hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine">
                <ArrowLeft size={15} strokeWidth={1.8} aria-hidden="true" />
                Reservas
            </Link>

            <div className="mt-4 mb-8 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl font-medium tracking-[-0.035em] text-charcoal sm:text-5xl">{reservation.reference}</h1>
                <StatusBadge label={reservationStatusLabels[reservation.status]} tone={reservationStatusTone(reservation.status)} />
                <p className="w-full text-sm text-muted">
                    Pedida a {dateTime.format(reservation.createdAt)}
                    {reservation.expiresAt &&
                        isOpen(reservation.status) &&
                        ` · expira a ${dateTime.format(reservation.expiresAt)}`}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="min-w-0 space-y-6">
                    <Panel title="Produto">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <Link href={`/admin/produtos/${product.id}`} className="text-sm font-semibold text-charcoal underline-offset-4 hover:underline">
                                    {product.name}
                                </Link>
                                <p className="text-xs text-muted">
                                    {product.sku} · {reservation.quantity} × {formatCurrency(reservation.unitPriceCents / 100)}
                                </p>
                            </div>
                            <span className="text-sm font-semibold text-charcoal">
                                {formatCurrency((reservation.unitPriceCents * reservation.quantity) / 100)}
                            </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                            <div>
                                <dt className="text-xs text-muted">Stock reservado</dt>
                                <dd className="font-semibold text-charcoal">{reservation.stockHeld ? `Sim (${reservation.quantity})` : "Não"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-muted">Stock disponível</dt>
                                <dd className="font-semibold text-charcoal">{product.stockQuantity}</dd>
                            </div>
                        </dl>
                    </Panel>

                    <Panel title="Cliente">
                        <p className="text-sm font-semibold text-charcoal">{reservation.customerName}</p>
                        <p className="mt-1 text-sm break-all">
                            <a href={`mailto:${reservation.customerEmail}`} className="text-wine underline-offset-4 hover:underline">{reservation.customerEmail}</a>
                        </p>
                        <p className="text-sm">
                            <a href={`tel:${reservation.customerPhone.replace(/\s+/g, "")}`} className="text-charcoal">{reservation.customerPhone}</a>
                        </p>
                        <p className="mt-2 text-xs text-muted">{reservation.user ? `Conta: ${reservation.user.email}` : "Pedido sem conta"}</p>
                        {reservation.customerNotes && (
                            <p className="mt-3 rounded-2xl bg-surface-muted p-4 text-sm break-words text-charcoal">
                                <span className="block text-xs font-semibold text-muted">Mensagem do cliente</span>
                                {reservation.customerNotes}
                            </p>
                        )}
                    </Panel>

                    <Panel title="Notas internas">
                        <ReservationNotesForm reference={reservation.reference} notes={reservation.internalNotes} />
                    </Panel>
                </div>

                <div className="min-w-0 space-y-6">
                    <Panel title="Ações">
                        <ReservationActions reference={reservation.reference} status={reservation.status} />
                    </Panel>
                    <Panel title="Histórico">
                        <Timeline
                            items={reservation.events.map((event) => ({
                                id: event.id,
                                title: reservationStatusLabels[event.toStatus],
                                meta: `${dateTime.format(event.createdAt)} · ${actorLabels[event.actor]}`,
                                note: event.note,
                            }))}
                        />
                    </Panel>
                </div>
            </div>
        </>
    );
}
