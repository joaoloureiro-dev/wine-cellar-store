import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { EmptyState } from "@/components/account/empty-state";
import { ReservationList } from "@/components/account/reservation-list";
import { getUserReservations } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "As minhas reservas", robots: { index: false, follow: false } };

export default async function AccountReservationsPage() {
    const user = await requireUser("/conta/reservas");
    const reservations = await getUserReservations(user.id);

    return (
        <>
            <AccountHeading title="Reservas" description="Reservas feitas com sessão iniciada." />
            {reservations.length > 0 ? (
                <ReservationList reservations={reservations} />
            ) : (
                <EmptyState title="Ainda sem reservas" description="Reserve uma cave na página do produto, sem pagamento imediato." href="/reservas" cta="Como funcionam as reservas" />
            )}
        </>
    );
}
