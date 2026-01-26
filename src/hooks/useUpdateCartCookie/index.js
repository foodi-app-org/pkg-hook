import { useEffect, useReducer } from 'react'
import { Cookies } from '../../cookies'
import { getCurrentDomain } from '../../utils'
import { initializer } from '../useSales/helpers/initializer.utils'

export const useUpdateCartCookie = () => {
  const keyToSaveData = process.env.LOCAL_SALES_STORE
  const domain = getCurrentDomain()

  const PRODUCT = (state, action) => {
    switch (action.type) {
      case 'REMOVE_PRODUCT_TO_CART':
        return {
          ...state,
          PRODUCT: state?.PRODUCT?.filter((t) => {
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
  const [data, dispatch] = useReducer(PRODUCT, { PRODUCT: [], counter: 0 }, initializer)

  const handleRemoveProductToCookieCart = (product) => {
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
