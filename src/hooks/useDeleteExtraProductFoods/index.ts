import { useMutation } from '@apollo/client'
import { DELETE_EXTRA_PRODUCTS } from '../useDessertWithPrice/queries'

export const useDeleteExtraProductFoods = () => {
  const [deleteExtraProductFoods, { loading, error }] = useMutation(DELETE_EXTRA_PRODUCTS)

  return {
    deleteExtraProductFoods,
    loading,
    error
  }
}
