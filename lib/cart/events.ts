import { CART_COUNT_COOKIE } from "@/lib/cart/constants";

/** Fired on window after any cart mutation completes in this tab. */
export const CART_UPDATED_EVENT = "cellarium:cart-updated";

export function notifyCartUpdated() {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function readCartCountCookie() {
    const match = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${CART_COUNT_COOKIE}=`));
    const count = Number(match?.split("=")[1]);

    return Number.isInteger(count) && count > 0 ? count : 0;
}
