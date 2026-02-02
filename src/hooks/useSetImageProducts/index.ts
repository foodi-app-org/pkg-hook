import { useMutation, useApolloClient } from '@apollo/client'

import { GET_ONE_PRODUCTS_FOOD } from '../useProductsFood/queriesStore'

import { UPDATE_IMAGE_PRODUCT_FOOD } from './queries'

/**
 * Hook to update product image and sync Apollo cache.
 *
 * @returns {[Function, Object]} mutation function and its state
 */
export const useSetImageProducts = () => {
  const client = useApolloClient()

  const [setImageProducts, { data, loading, error }] = useMutation(UPDATE_IMAGE_PRODUCT_FOOD)

  /**
   * Updates product image and manually updates Apollo cache.
   *
   * @param {Object} variables - Requires pId and image
   * @returns {Promise<any>}
   */
  const updateImageProducts = async (variables: { pId: number; image: string }) => {
    const { pId, image } = variables

    if (!pId || !image) throw new Error('Missing pId or image')

    const response = await setImageProducts({
      variables: { input: { pId, image } }
    })
    const { ProImage } = response?.data?.setImageProducts?.data ?? {}
    try {
      const existing = client.readQuery({
        query: GET_ONE_PRODUCTS_FOOD,
        variables: { pId }
      })

      if (!existing?.productFoodsOne) return response

      // 📝 Escribir de nuevo el producto con la imagen actualizada
      client.writeQuery({
        query: GET_ONE_PRODUCTS_FOOD,
        variables: { pId },
        data: {
          productFoodsOne: {
            ...existing.productFoodsOne,
            ProImage
          }
        }
      })
    } catch (err) {
      console.warn('⚠️ Error updating cache for GET_ONE_PRODUCTS_FOOD:', err)
    }

    return response
  }

  return [updateImageProducts, { data, loading, error }]
}
