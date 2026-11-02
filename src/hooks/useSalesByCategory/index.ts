import { gql, useQuery } from '@apollo/client'

import { DashboardFilterInput } from '../useDashboardSummary'

const GET_SALES_BY_CATEGORY = gql`
  query GetDashboardSalesByCategory($filter: DashboardFilterInput) {
    getDashboardSalesByCategory(filter: $filter) {
      totalRevenue
      slices { categoryId categoryName revenue units percentage }
    }
  }
`

/**
 * Fetches revenue/units/percentage grouped by product category for the period.
 *
 * @param filter - Dashboard period/filters.
 * @returns A tuple `[salesByCategory, { loading, error, refetch }]`.
 */
export const useSalesByCategory = (filter: DashboardFilterInput = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_SALES_BY_CATEGORY, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  return [data?.getDashboardSalesByCategory, { loading, error, refetch }] as const
}
