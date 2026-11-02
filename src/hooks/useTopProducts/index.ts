import { gql, useQuery } from '@apollo/client'

import { DashboardFilterInput } from '../useDashboardSummary'

const GET_TOP_PRODUCTS = gql`
  query GetDashboardTopProducts($filter: DashboardFilterInput) {
    getDashboardTopProducts(filter: $filter) {
      idProduct
      productName
      image
      unitsSold
      revenue
    }
  }
`

/**
 * Fetches the best-selling products ranked by real completed sales (units or
 * revenue). This is distinct from `useTopProductsMovements`, which ranks raw
 * inventory OUT movements and is kept for the inventory section.
 *
 * @param filter - Dashboard period/filters. Use `sortBy: 'revenue'` to rank by
 *   income; defaults to units. `categoryIds` scopes the ranking.
 * @returns A tuple `[topProducts, { loading, error, refetch }]`.
 */
export const useTopProducts = (filter: DashboardFilterInput = {}) => {
  const { data, loading, error, refetch } = useQuery(GET_TOP_PRODUCTS, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  return [data?.getDashboardTopProducts, { loading, error, refetch }] as const
}
