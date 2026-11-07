import { SalesState } from '../types'
import { resolveBaseLineTotal } from './pricing.utils'

import type { Product } from 'typesdefs'


/**
 * Toggle the courtesy ("free") state of a product and recalculate its price.
 *
 * Business rule: `free` has ABSOLUTE priority over any discount.
 *  - Turning free ON  → price becomes 0 and the discount footprint on this
 *    product (`originalProPrice`, per-item discount metadata) is dropped, so the
 *    gift is never discounted and never carries a stale pre-discount price.
 *  - Turning free OFF → price is restored to its base line total
 *    (`unitPrice * quantity`, falling back to the catalog price when the cart
 *    item has no stored unit price). Any lingering discount footprint is also
 *    cleared so the restored price is the clean, non-discounted base. If the
 *    operator wants the global discount to apply again, re-applying it will
 *    recompute from this clean base.
 *
 * @param {SalesState} state - Current reducer state.
 * @param {{ pId: string }} payload - Payload containing pId.
 * @param {Product[]} productsFood - Catalog list used to resolve the unit price.
 * @returns {SalesState} Updated state.
 */
export const toggleFreeProducts = (state: SalesState, payload: { pId: string }, productsFood: Product[]) => {
    const pId = payload?.pId
    if (!pId) return state

    // Find the reference product price only once
    const referenceProduct = productsFood.find((item: Product) => { return item.pId === pId })
    if (!referenceProduct) return state

    const list = state.PRODUCT
    const index = list.findIndex((item: Product) => { return item.pId === pId })

    // If no match, skip re-render
    if (index === -1) return state

    const target = list[index]
    const newFreeState = !target.free

    // Drop the discount footprint from this line regardless of direction, so a
    // gift never keeps a pre-discount price and a restored product starts from a
    // clean base.
    const {
        originalProPrice,
        discountAmount,
        discountPercent,
        ...rest
    } = target as any

    // Non-discounted base when turning free OFF. Prefer the stored unitPrice
    // (via the shared helper) and fall back to the catalog price × quantity so
    // the behaviour matches the rest of the POS price model.
    const quantity = Number(target.ProQuantity ?? 1) || 1
    const restoredBase = resolveBaseLineTotal({
        ...target,
        free: false
    }) || (quantity * Number(referenceProduct.ProPrice ?? 0))

    const updatedItem = {
        ...rest,
        free: newFreeState,
        ProPrice: newFreeState ? 0 : restoredBase
    }

    // Clone array ONCE
    const newList = [...list]
    newList[index] = updatedItem

    return {
        ...state,
        PRODUCT: newList
    }
}
