import { gql, useQuery } from '@apollo/client'

/**
 * GraphQL query to get today's total sales amount.
 */
const GET_SALES_AMOUNT_TODAY = gql`
  query GetSalesAmountToday {
    getSalesAmountToday {
      success
      message
      total
    }
  }
`

/**
 * Custom hook to fetch today's sales amount.
 * @returns {{
 *   data: { success: boolean, message: string, total: number } | undefined,
 *   loading: boolean,
 *   error: any,
 *   refetch: () => void
 * }}
 */
export const useGetSalesAmountToday = () => {
  const { data, loading, error, refetch } = useQuery(GET_SALES_AMOUNT_TODAY, {
    fetchPolicy: 'network-only'
  })

  return [data?.getSalesAmountToday, { loading, error, refetch }]
}
