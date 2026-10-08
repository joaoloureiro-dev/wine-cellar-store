import "server-only";

import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo/metadata";
import { getProductHref } from "@/lib/routes";

const euros = (cents: number) => cents / 100;

/**
 * Everything the store keeps about a customer's account (RGPD art. 15 and
 * 20), as a portable JSON document. Scoped by the session's user id: guest
 * orders with the same email are not included, since the email address has
 * not been verified as theirs.
 */
export async function buildAccountExport(userId: string) {
    const [user, addresses, favorites, orders, reservations] = await Promise.all([
        db.user.findUniqueOrThrow({
            where: { id: userId },
            select: { name: true, email: true, emailVerified: true, createdAt: true, accounts: { select: { providerId: true, createdAt: true } } },
        }),
        db.address.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: {
                label: true,
                recipientName: true,
                phone: true,
                addressLine1: true,
                addressLine2: true,
                postalCode: true,
                city: true,
                country: true,
                isDefault: true,
                createdAt: true,
            },
        }),
        db.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true, product: { select: { name: true, slug: true, brand: { select: { slug: true } } } } },
        }),
        db.order.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: {
                reference: true,
                status: true,
                paymentMethod: true,
                subtotalCents: true,
                shippingCents: true,
                totalCents: true,
                shippingMethod: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                taxId: true,
                addressLine1: true,
                addressLine2: true,
                postalCode: true,
                city: true,
                country: true,
                customerNotes: true,
                termsAcceptedAt: true,
                createdAt: true,
                items: { select: { productName: true, sku: true, unitPriceCents: true, quantity: true, lineTotalCents: true } },
                events: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
                payments: { orderBy: { createdAt: "asc" }, select: { method: true, status: true, amountCents: true, createdAt: true } },
            },
        }),
        db.reservation.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: {
                reference: true,
                status: true,
                quantity: true,
                unitPriceCents: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                customerNotes: true,
                privacyConsentAt: true,
                createdAt: true,
                product: { select: { name: true } },
                events: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true } },
            },
        }),
    ]);

    return {
        exportedAt: new Date().toISOString(),
        controller: "Cellarium",
        account: {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            signInMethods: user.accounts.map((account) => ({ method: account.providerId === "credential" ? "password" : account.providerId, since: account.createdAt })),
        },
        addresses,
        favorites: favorites.map((favorite) => ({
            product: favorite.product.name,
            url: absoluteUrl(getProductHref({ brandSlug: favorite.product.brand.slug, slug: favorite.product.slug })),
            addedAt: favorite.createdAt,
        })),
        orders: orders.map(({ subtotalCents, shippingCents, totalCents, items, payments, events, ...order }) => ({
            ...order,
            currency: "EUR",
            subtotal: euros(subtotalCents),
            shipping: euros(shippingCents),
            total: euros(totalCents),
            items: items.map(({ unitPriceCents, lineTotalCents, ...item }) => ({ ...item, unitPrice: euros(unitPriceCents), lineTotal: euros(lineTotalCents) })),
            payments: payments.map(({ amountCents, ...payment }) => ({ ...payment, amount: euros(amountCents) })),
            history: events.map((event) => ({ status: event.toStatus, at: event.createdAt })),
        })),
        reservations: reservations.map(({ unitPriceCents, product, events, ...reservation }) => ({
            ...reservation,
            product: product.name,
            unitPrice: euros(unitPriceCents),
            history: events.map((event) => ({ status: event.toStatus, at: event.createdAt })),
        })),
    };
}
