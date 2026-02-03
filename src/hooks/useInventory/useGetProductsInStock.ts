import { useQuery } from '@apollo/client'

import { GET_PRODUCTS_IN_STOCK } from './queries'

export const useGetProductsInStock = (storeId: string) => {
  const { data, loading, error } = useQuery(GET_PRODUCTS_IN_STOCK, {
    variables: { storeId },
    skip: !storeId
  })

  return {
    data: data?.getProductsInStock || [],
    loading,
    error
  }
}
