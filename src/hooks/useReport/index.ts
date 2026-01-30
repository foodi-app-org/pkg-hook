import { useQuery, useLazyQuery } from '@apollo/client'

import { GET_ALL_SALES, GET_ALL_TOTAL_SALES } from './queries'

export const useReport = ({
  fromDate = '',
  more,
  search = '',
  channel = null,
  toDate = '',
  lazyQuery = false
}) => {
  const [getAllSalesStore, { data: lazyDataSales, loading: lazyLoading }] = useLazyQuery(GET_ALL_SALES)

  // Combine both queries to reduce separate requests
  const { data, fetchMore, loading } = useQuery(GET_ALL_SALES, {
    fetchPolicy: lazyQuery ? 'cache-and-network' : 'network-only',
    skip: lazyQuery,
    variables: {
      min: 0,
      fromDate,
      channel,
      search,
      toDate,
      max: more
    }
  })

  // Get total sales in the same query
  const { data: totalSalesData } = useQuery(GET_ALL_TOTAL_SALES, {
    variables: {
      fromDate,
      toDate
    }
  })

  const totalSales = totalSalesData?.getAllSalesStoreTotal ?? {}
  console.log(totalSales)
  return {
    getAllSalesStore: lazyQuery ? getAllSalesStore : () => { }, // Return function only if in lazy mode
    data: lazyQuery ? lazyDataSales : data, // Use data from lazy query if available
    loading: lazyQuery ? lazyLoading || loading : loading,
    totalSales: totalSales.TOTAL || 0,
    restaurant: totalSales.restaurant || 0,
    delivery: totalSales.delivery || 0,
    fetchMore
  }
}
