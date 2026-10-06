/** httpOnly cookie holding the cart lines (product IDs and quantities). */
export const CART_COOKIE = "cellarium_cart";

/**
 * Readable cookie with the total item count, so the header badge can be
 * rendered client-side without making every page dynamic.
 */
export const CART_COUNT_COOKIE = "cellarium_cart_count";

export const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const MAX_QUANTITY_PER_ITEM = 10;

export const MAX_CART_LINES = 30;
