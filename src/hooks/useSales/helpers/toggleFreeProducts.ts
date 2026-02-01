import { Product } from 'typesdefs'

import { SalesState } from '../types'

/**
 * Toggles free mode for a product and recalculates its price
 * with maximum performance.
 * @param {SalesState} state - Current reducer state.
 * @param {any} payload - Payload containing pId.
 * @param payload.pId
 * @param {Product[]} productsFood - List of products for reference.
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

    const updatedItem = {
        ...target,
        free: newFreeState,
        ProPrice: newFreeState
            ? 0
            : (target.ProQuantity ?? 1) * (referenceProduct.ProPrice ?? 0)
    }

    // Clone array ONCE
    const newList = [...list]
    newList[index] = updatedItem

    return {
        ...state,
        PRODUCT: newList
    }
}