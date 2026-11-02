import { gql, useQuery } from '@apollo/client'

/**
 * Dashboard filter accepted by every commercial-dashboard hook. Dates are
 * calendar dates in the business timezone; the backend converts them to a
 * half-open UTC interval.
 */
export interface DashboardFilterInput {
  preset?: 'day' | '15-days' | 'month' | 'custom'
  referenceDate?: string
  from?: string
  to?: string
  timezone?: string
  categoryIds?: string[]
  productIds?: string[]
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

const GET_DASHBOARD_SUMMARY = gql`
  query GetDashboardSummary($filter: DashboardFilterInput) {
    getDashboardSummary(filter: $filter) {
      revenue { value previousValue percentageChange trend }
      orders { value previousValue percentageChange trend }
      products { value previousValue percentageChange trend }
      activeCustomers { value previousValue percentageChange trend }
      revenueSparkline
      ordersSparkline
      range { startAt endAt timezone }
    }
  }
`

/**
 * Fetches the four top-card KPIs (revenue, orders, products, active customers)
 * with previous-period comparisons and sparklines for the given period.
 *
 * @param filter - Dashboard period/filters. The period is passed to the server.
 * @returns A tuple `[summary, { loading, error, refetch }]`.
 */
export const useDashboardSummary = (filter: DashboardFilterInput = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_SUMMARY, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  return [data?.getDashboardSummary, { loading, error, refetch }] as const
}
