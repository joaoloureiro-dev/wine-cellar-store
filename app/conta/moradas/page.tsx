import type { Metadata } from "next";

import { AccountHeading } from "@/components/account/account-heading";
import { AddressCard } from "@/components/account/address-card";
import { AddressForm } from "@/components/account/address-form";
import { getUserAddresses } from "@/lib/account/queries";
import { MAX_ADDRESSES } from "@/lib/account/schema";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Moradas", robots: { index: false, follow: false } };

export default async function AccountAddressesPage() {
    const user = await requireUser("/conta/moradas");
    const addresses = await getUserAddresses(user.id);

    return (
        <>
            <AccountHeading title="Moradas" description="A morada principal é usada para preencher o checkout." />

            {addresses.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {addresses.map((address) => (
                        <AddressCard key={address.id} address={address} />
                    ))}
                </div>
            )}

            {addresses.length < MAX_ADDRESSES && (
                <section aria-labelledby="new-address-heading" className="mt-10">
                    <h2 id="new-address-heading" className="mb-4 font-display text-2xl font-semibold text-charcoal">
                        Adicionar morada
                    </h2>
                    <div className="rounded-3xl border border-charcoal/8 bg-surface shadow-card p-5 sm:p-6">
                        <AddressForm />
                    </div>
                </section>
            )}
        </>
    );
}
