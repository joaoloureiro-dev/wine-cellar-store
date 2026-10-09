import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { LinkedSection } from "@/components/account/linked-section";
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
                <LinkedSection title="Encomendas recentes" href="/conta/encomendas" linkLabel="Ver todas">
                    {orders.length > 0 ? (
                        <OrderList orders={orders} />
                    ) : (
                        <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-6 text-sm text-muted">Ainda não fez encomendas com esta conta.</p>
                    )}
                </LinkedSection>

                <LinkedSection title="Reservas recentes" href="/conta/reservas" linkLabel="Ver todas">
                    {reservations.length > 0 ? (
                        <ReservationList reservations={reservations} />
                    ) : (
                        <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-6 text-sm text-muted">Ainda não fez reservas com esta conta.</p>
                    )}
                </LinkedSection>

                <LinkedSection title="Morada principal" href="/conta/moradas" linkLabel="Gerir moradas">
                    {address ? (
                        <address className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 text-sm not-italic leading-6 text-charcoal">
                            <strong>{address.recipientName}</strong>
                            <br />
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                            <br />
                            {address.postalCode} {address.city}
                        </address>
                    ) : (
                        <p className="rounded-3xl border border-dashed border-charcoal/15 bg-surface px-6 py-6 text-sm text-muted">Guarde uma morada para acelerar o checkout.</p>
                    )}
                </LinkedSection>
            </div>
        </>
    );
}
