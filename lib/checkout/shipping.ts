/**
 * Shipping rules.
 *
 * ⚠️ PLACEHOLDER VALUES: prices and the free-shipping threshold must be
 * confirmed by the business before launch. They live in this single file so
 * changing them never touches checkout logic.
 */

export type ShippingMethod = {
    id: "home-delivery";
    label: string;
    description: string;
    priceCents: number;
    /** Orders with a subtotal at or above this amount ship for free. */
    freeFromSubtotalCents: number | null;
};

export const shippingMethods: readonly ShippingMethod[] = [
    {
        id: "home-delivery",
        label: "Entrega ao domicílio",
        description: "Entrega especializada em Portugal Continental. Agendamos a entrega consigo.",
        priceCents: 4900,
        freeFromSubtotalCents: 100000,
    },
];

export type ShippingMethodId = ShippingMethod["id"];

export const DEFAULT_SHIPPING_METHOD: ShippingMethodId = "home-delivery";

export function getShippingMethod(id: string) {
    return shippingMethods.find((method) => method.id === id) ?? null;
}

export function calculateShippingCents(method: ShippingMethod, subtotalCents: number) {
    if (
        method.freeFromSubtotalCents !== null &&
        subtotalCents >= method.freeFromSubtotalCents
    ) {
        return 0;
    }

    return method.priceCents;
}
