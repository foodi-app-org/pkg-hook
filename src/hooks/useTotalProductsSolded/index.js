import { useQuery, gql } from '@apollo/client'

const GET_TOTAL_PRODUCTS_SOLD = gql`
  query {
    getTotalProductsSold
  }
`

/**
 * Custom hook to fetch the total number of products sold.
 * @returns {{ totalSold: number, loading: boolean, error: any }}
 */
export const useTotalProductsSolded = () => {
  const { data, loading, error } = useQuery(GET_TOTAL_PRODUCTS_SOLD)

  return [data?.getTotalProductsSold, {
    loading,
    error
  }]
}
