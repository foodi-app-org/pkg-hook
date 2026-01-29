import { useQuery, gql } from '@apollo/client'

/**
 * GraphQL query to fetch top-selling products movements
 */
const GET_TOP_PRODUCTS_MOVEMENTS = gql`
  query {
    getTopProductsMovements {
      productName
      idProduct
      totalMovements
    }
  }
`

/**
 * Custom hook to fetch and return the top-selling products movements
 * @returns {Object} - { data, loading, error }
 */
export const useTopProductsMovements = () => {
  const { data, loading, error } = useQuery(GET_TOP_PRODUCTS_MOVEMENTS)

  return [data?.getTopProductsMovements, {
    loading,
    error
  }]
}
