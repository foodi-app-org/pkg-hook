/**
 * Minimal shape needed to compute the counter. Accepting a structural type
 * (anything carrying a `ProQuantity`) keeps this helper usable across the
 * different product shapes handled by the reducer without fighting the strict
 * `Product` type.
 */
interface CountableProduct {
    ProQuantity?: number | string | null
}

/**
 * Derives the cart counter from the actual products in the cart.
 *
 * This is the single source of truth for "number of products". By always
 * recomputing the counter from the real `ProQuantity` of every item, the
 * counter can never drift out of sync with the cart, regardless of the
 * order of operations (edit, cancel, confirm, increment, decrement, remove).
 *
 * Any invalid or negative quantity is coerced to 0 so the counter stays a
 * safe, non-negative integer.
 *
 * @param products - Products currently in the cart.
 * @returns The total units in the cart (never negative).
 */
export const recalculateCounter = (
    products: CountableProduct[] = []
): number => {
    if (!Array.isArray(products) || products.length === 0) {
        return 0
    }

    const total = products.reduce((sum: number, item: CountableProduct) => {
        const quantity = Number(item?.ProQuantity)

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return sum
        }

        return sum + quantity
    }, 0)

    return Math.max(0, total)
}
