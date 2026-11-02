import { gql, useQuery } from '@apollo/client'

import { DashboardFilterInput } from '../useDashboardSummary'

const GET_RECENT_ORDERS = gql`
  query GetDashboardRecentOrders($filter: DashboardFilterInput) {
    getDashboardRecentOrders(filter: $filter) {
      total
      page
      pageSize
      rows {
        orderId
        code
        productSummary
        extraItems
        createdAt
        statusState
        total
      }
    }
  }
`

/**
 * Fetches a paginated list of recent orders for the period, with optional
 * status/search filters and allowlisted sorting handled by the backend.
 *
 * @param filter - Dashboard period/filters plus page/pageSize/sortBy/search.
 * @returns A tuple `[recentOrdersPage, { loading, error, refetch }]`.
 */
export const useRecentOrders = (filter: DashboardFilterInput = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_RECENT_ORDERS, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  return [data?.getDashboardRecentOrders, { loading, error, refetch }] as const
}
