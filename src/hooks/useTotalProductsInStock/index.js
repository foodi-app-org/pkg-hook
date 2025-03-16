import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch total products in stock.
 */
const GET_TOTAL_PRODUCTS_IN_STOCK = gql`
  query getTotalProductsInStock {
    getTotalProductsInStock
  }
`

/**
 * Custom hook to fetch total products in stock.
 * @returns {Object} - { totalProductsInStock, loading, error }
 */
export const useTotalProductsInStock = () => {
  const { data, loading, error } = useQuery(GET_TOTAL_PRODUCTS_IN_STOCK)

  return [data?.getTotalProductsInStock ?? 0, {
    loading,
    error
  }]
}
