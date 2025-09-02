import { useQuery } from '@apollo/client'
import { GET_ULTIMATE_CATEGORY_PRODUCTS } from './queries'

export const useCategoriesProduct = () => {
  const {
    data,
    loading,
    error,
    networkStatus
  } = useQuery(GET_ULTIMATE_CATEGORY_PRODUCTS)

  return [data?.catProductsAll, { loading, error, networkStatus }]
}
