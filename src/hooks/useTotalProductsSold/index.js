import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch total products sold.
 */
const GET_TOTAL_PRODUCTS_SOLD = gql`
  query getTotalSalesSold {
    getTotalSalesSold
  }
`

/**
 * Custom hook to fetch total products sold.
 * @returns {Object} - { totalProductsSold, loading, error }
 */
export const useTotalProductsSold = () => {
  const { data, loading, error } = useQuery(GET_TOTAL_PRODUCTS_SOLD)

  return [data?.getTotalSalesSold || 0, {
    loading,
    error
  }]
}
