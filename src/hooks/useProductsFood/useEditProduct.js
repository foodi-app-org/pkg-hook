import { useMutation } from '@apollo/client'
import { EDIT_PRODUCT } from './queriesStore'

export const useEditProduct = () => {
  const [editProductFoods, { loading, error }] = useMutation(EDIT_PRODUCT)

  return [editProductFoods, { loading, error }]
}
