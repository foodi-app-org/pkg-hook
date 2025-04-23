import { useMutation } from '@apollo/client'
import { UPDATE_IMAGE_PRODUCT_FOOD } from './queries'

export const useSetImageProducts = () => {
  const [setImageProducts, { data, loading, error }] = useMutation(UPDATE_IMAGE_PRODUCT_FOOD)

  const updateImageProducts = async (variables) => {
    try {
      const response = await setImageProducts({
        variables: {
          input: {
            ...variables
          }
        }
      })
      return response
    } catch (err) {
      console.error('Error updating image products:', err)
      throw err
    }
  }

  return [updateImageProducts, {
    data,
    loading,
    error
  }]
}
