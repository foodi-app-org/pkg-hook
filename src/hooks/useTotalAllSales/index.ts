import { useQuery, gql } from '@apollo/client'

const GET_TOTAL_SALES = gql`
  query totalSales {
    totalSales {
      success
      message
      totalSales
      totalDiscount
      netTotal
    }
  }
`

/**
 * Custom hook to fetch total sales from the GraphQL API.
 *
 * Returns the GROSS value of concluded sales as the headline figure
 * (`totalSales`), plus the discount-aware breakdown (`totalDiscount`,
 * `netTotal`) on the metadata object for consumers that need net income.
 *
 * @returns {[number, { loading, error, refetch, totalDiscount, netTotal }]}
 */
export const useTotalAllSales = () => {
  const { data, loading, error, refetch } = useQuery(GET_TOTAL_SALES)

  return [data?.totalSales?.totalSales, {
    loading,
    error,
    refetch,
    totalDiscount: data?.totalSales?.totalDiscount,
    netTotal: data?.totalSales?.netTotal
  }]
}
