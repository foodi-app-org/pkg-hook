import { gql, useQuery } from '@apollo/client'

import { DashboardFilterInput } from '../useDashboardSummary'

const GET_SALES_TREND = gql`
  query GetDashboardSalesTrend($filter: DashboardFilterInput) {
    getDashboardSalesTrend(filter: $filter) {
      granularity
      totalRevenue
      totalOrders
      points { bucket revenue orders }
    }
  }
`

/**
 * Fetches the sales trend time-series for the given period. Granularity is
 * resolved by the backend (hour/day/week) based on range length.
 *
 * @param filter - Dashboard period/filters.
 * @returns A tuple `[salesTrend, { loading, error, refetch }]`.
 */
export const useSalesTrend = (filter: DashboardFilterInput = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_SALES_TREND, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  return [data?.getDashboardSalesTrend, { loading, error, refetch }] as const
}
