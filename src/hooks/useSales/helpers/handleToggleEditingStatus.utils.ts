import { SalesState } from '../types'

import type { Product } from 'typesdefs'

/**
 * Toggles the editing state of a product.
 *
 * @param state Current sales state.
 * @param action Product containing the pId to toggle.
 * @returns Updated sales state.
 */
export const handleToggleEditingStatus = (
    state: SalesState,
    action: Product
): SalesState => {
    const pId = action?.pId

    if (!pId) {
        return state
    }

    const index = state.PRODUCT.findIndex(
        (item: Product) => item.pId === pId
    )

    if (index === -1) {
        return state
    }

    const target = state.PRODUCT[index]

    const updatedItem: Product = {
        ...target,
        editing: !target.editing,
        oldQuantity: target.ProQuantity ?? 0
    }

    const PRODUCT = [...state.PRODUCT]
    PRODUCT[index] = updatedItem

    return {
        ...state,
        PRODUCT
    }
}
