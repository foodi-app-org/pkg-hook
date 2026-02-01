import {
    ExtProductFoodOptional,
    ExtProductFoodsAll,
    Product
} from 'typesdefs'

import { SalesState } from '../types'

/**
 *
 * @param state {SalesState}
 * @param action {Object}
 * @param action.payload {string}
 * @param action.dataOptional {ExtProductFoodOptional[]}
 * @param action.dataExtra {ExtProductFoodsAll[]}
 * @returns {any}
 */
export const handleUpdateAllExtraAndOptional = (state: SalesState, action: {
    payload: string,
    dataOptional?: ExtProductFoodOptional[],
    dataExtra?: ExtProductFoodsAll[]
}) => {
    return {
        ...state,
        PRODUCT: state?.PRODUCT?.map((items: Product) => {
            return items.pId === action.payload
                ? {
                    ...items,
                    dataOptional: action.dataOptional || [],
                    dataExtra: action.dataExtra || []
                }
                : items
        })
    }
}