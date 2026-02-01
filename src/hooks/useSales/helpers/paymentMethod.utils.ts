import { SalesState } from '../types'

export const paymentMethod = (state: SalesState, action: any) => {
    return {
        ...state,
        payId: action.payload
    }
}