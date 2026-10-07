import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { AccountHeading } from "@/components/account/account-heading";
import { OrderList } from "@/components/account/order-list";
import { ReservationList } from "@/components/account/reservation-list";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getDefaultAddress, getUserOrders, getUserReservations } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "A minha conta",
    robots: { index: false, follow: false },
};

export default async function AccountPage() {
    const user = await requireUser("/conta");
    const [orders, reservations, address] = await Promise.all([
        getUserOrders(user.id, 3),
        getUserReservations(user.id, 3),
        getDefaultAddress(user.id),
    ]);

    return (
        <>
            <AccountHeading title={`Olá, ${user.name}`} description={user.email} action={<SignOutButton />} />

            <div className="space-y-10">
                <Section title="Encomendas recentes" href="/conta/encomendas" linkLabel="Ver todas">
                    {orders.length > 0 ? (
                        <OrderList orders={orders} />
                    ) : (
                        <p className="text-sm text-muted">Ainda não fez encomendas com esta conta.</p>
                    )}
                </Section>

                <Section title="Reservas recentes" href="/conta/reservas" linkLabel="Ver todas">
                    {reservations.length > 0 ? (
                        <ReservationList reservations={reservations} />
                    ) : (
                        <p className="text-sm text-muted">Ainda não fez reservas com esta conta.</p>
                    )}
                </Section>

                <Section title="Morada principal" href="/conta/moradas" linkLabel="Gerir moradas">
                    {address ? (
                        <address className="rounded-xl border border-border bg-surface p-5 text-sm not-italic leading-6 text-charcoal">
                            <strong>{address.recipientName}</strong>
                            <br />
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                            <br />
                            {address.postalCode} {address.city}
                        </address>
                    ) : (
                        <p className="text-sm text-muted">Guarde uma morada para acelerar o checkout.</p>
                    )}
                </Section>
            </div>
        </>
    );
}

function Section({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: ReactNode }) {
    return (
        <section aria-label={title}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-charcoal">{title}</h2>
                <Link href={href} className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-wine hover:text-wine-dark focus-visible:outline-2 focus-visible:outline-wine">
                    {linkLabel}
                    <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
                </Link>
            </div>
            {children}
        </section>
    );
}
