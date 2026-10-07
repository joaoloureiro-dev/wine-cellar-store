import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { EmptyState } from "@/components/account/empty-state";
import { OrderList } from "@/components/account/order-list";
import { getUserOrders } from "@/lib/account/queries";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "As minhas encomendas", robots: { index: false, follow: false } };

export default async function AccountOrdersPage() {
    const user = await requireUser("/conta/encomendas");
    const orders = await getUserOrders(user.id);

    return (
        <>
            <AccountHeading title="Encomendas" description="Encomendas feitas com sessão iniciada." />
            {orders.length > 0 ? (
                <OrderList orders={orders} />
            ) : (
                <EmptyState title="Ainda sem encomendas" description="As encomendas que fizer com a sessão iniciada aparecem aqui." href="/caves" cta="Explorar caves" />
            )}
        </>
    );
}
