import { SalesState } from '../types'

import type { Product } from 'typesdefs'


/**
 * Toggles editing state of a product with maximum performance.
 * @param state
 * @param action
 * @param action.payload
 * @param action.payload.pId
 * @returns {SalesState} Updated state.
 */
export const handleToggleEditingStatus = (
    state: SalesState,
    action: { payload: { pId: string } }
): SalesState => {
    const pId = action?.payload?.pId
    if (!pId) return state

    const list = state.PRODUCT
    const index = list.findIndex((item: Product) => { return item.pId === pId })

    // If no match, nothing changes → no re-render
    if (index === -1) return state

    const target = list[index]

    const updatedItem = {
        ...target,
        editing: !target.editing,
        oldQuantity: target.ProQuantity ?? 0
    }

    // Clone the array only once
    const newList = [...list]
    newList[index] = updatedItem

    return {
        ...state,
        PRODUCT: newList
    }
}