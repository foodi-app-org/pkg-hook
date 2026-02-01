import { useCallback } from 'react'

import { resolveProduct } from './resolveProduct'

/**
 * useAddToCart - returns a stable handler that resolves product and dispatches ADD_TO_CART
 * @param {Object} params
 * @param {(params:{pId:string})=>Promise<any>} params.handleGetOneProduct - api fetch function (hook)
 * @param {any[]} params.productsFood - in-memory products list
 * @param {(action:any)=>void} params.dispatch - reducer dispatch
 * @param {(n:{title:string,backgroundColor:string,description:string})=>void} params.sendNotification
 * - notification sender
 * @returns {(action:any)=>Promise<void>} stable handler to add product to cart
 */
export const useAddToCart = ({
  handleGetOneProduct,
  productsFood,
  dispatch,
  sendNotification
}: {
  handleGetOneProduct: (p: { pId: string }) => Promise<any>
  productsFood: any[]
  dispatch: (a: any) => void
  sendNotification: (n: { title: string; backgroundColor: string; description: string }) => void
}) => {
  return useCallback(
    async (action: any) => {
      const pId = action?.payload?.pId
      if (!pId) {
        sendNotification?.({
          title: 'Invalid product',
          backgroundColor: 'warning',
          description: 'Product identifier is missing'
        })
        return
      }

      // UX: show immediate feedback if you want (spinner, skeleton, etc.) — omitted for brevity

      const product = await resolveProduct({
        pId,
        productsFood,
        fetchProduct: handleGetOneProduct
      })

      if (!product) {
        sendNotification?.({
          title: 'Producto no encontrado',
          backgroundColor: 'warning',
          description: 'No se pudo obtener la información del producto'
        })
        return
      }

      // dispatch synchronous action with resolved product (reducer stays pure)
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          ...action.payload,
          __resolvedProduct: product
        }
      })
    },
    [handleGetOneProduct, productsFood, dispatch, sendNotification]
  )
}
