import { useEffect, useReducer } from 'react'

import { Cookies } from '../../cookies'
import { getCurrentDomain } from '../../utils'

type Product = {
  pId: string;
  ProQuantity: number;
  [key: string]: any;
};

type State = {
  PRODUCT: Product[];
  counter: number;
};

type Action =
  | { type: 'REMOVE_PRODUCT_TO_CART'; payload: Product }
  | { type: 'ADD_PRODUCT_TO_CART'; payload: Product }
  | { type: 'UPDATE_PRODUCT_IN_CART'; payload: Product }
  | { type: string; payload?: any };

export const useUpdateCartCookie = () => {
  const keyToSaveData = process.env.NEXT_LOCAL_SALES_STORE
  const domain = getCurrentDomain()

  const PRODUCT = (state: State, action: Action): State => {
    switch (action.type) {
      case 'REMOVE_PRODUCT_TO_CART':
        return {
          ...state,
          PRODUCT: state?.PRODUCT?.filter((t: Product) => {
            return t.pId !== action?.payload.pId
          }),
          counter: state.counter - action.payload.ProQuantity
        }
      case 'ADD_PRODUCT_TO_CART':
        // Add code for 'ADD_PRODUCT_TO_CART' case
        return state
      case 'UPDATE_PRODUCT_IN_CART':
        // Add code for 'UPDATE_PRODUCT_IN_CART' case
        return state
      default:
        return state
    }
  }
  const [data, dispatch] = useReducer(PRODUCT, { PRODUCT: [], counter: 0 })

  const handleRemoveProductToCookieCart = (product: Product) => {
    dispatch({ type: 'REMOVE_PRODUCT_TO_CART', payload: product })
  }
  useEffect(() => {
    // @ts-ignore
    Cookies.set(keyToSaveData, JSON.stringify(data), { domain, path: '/' })
  }, [data, domain])

  return {
    handleRemoveProductToCookieCart
  }
}
