import { useQuery, gql } from '@apollo/client'

const GET_TOTAL_SALES = gql`
  query totalSales {
    totalSales {
      success
      message
      totalSales
    }
  }
`

/**
 * Custom hook to fetch total sales from GraphQL API.
 * @returns {Object} An object containing total sales, loading state, error, and refetch function.
 */
export const useTotalAllSales = () => {
  const { data, loading, error, refetch } = useQuery(GET_TOTAL_SALES)

  return [data?.totalSales?.totalSales, {
    loading,
    error,
    refetch
  }]
}
