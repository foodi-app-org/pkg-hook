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

    const nextEditing = !target.editing

    // Only snapshot the baseline quantity when ENTERING edit mode. Capturing it
    // again on exit would overwrite the original value and break a later cancel.
    const nextOldQuantity = nextEditing
        ? (Number.isFinite(Number(target.ProQuantity))
            ? Number(target.ProQuantity)
            : 0)
        : target.oldQuantity

    const updatedItem: Product = {
        ...target,
        editing: nextEditing,
        oldQuantity: nextOldQuantity
    }

    const PRODUCT = [...state.PRODUCT]
    PRODUCT[index] = updatedItem

    return {
        ...state,
        PRODUCT
    }
}
