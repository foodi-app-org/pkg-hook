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

  const { data: dataSales, fetchMore, loading } = useQuery(GET_ALL_SALES,{
    fetchPolicy: 'network-only',
    skip: lazyQuery,
    variables: {
        min: 0,
        fromDate,
        channel:  channel,
        search,
        toDate,
        max: more
    }
  })
  // get total sales
  const { data: totalSales } = useQuery(GET_ALL_TOTAL_SALES, {
    variables: {
      fromDate,
      toDate,
  }
  })
  const data = lazyQuery ? lazyDataSales : dataSales

  return {
    getAllSalesStore,
    data: data,
    loading: lazyLoading || loading,
    totalSales: totalSales?.getAllSalesStoreTotal.TOTAL ?? 0,
    restaurant: totalSales?.getAllSalesStoreTotal.restaurant ?? 0,
    delivery: totalSales?.getAllSalesStoreTotal.delivery ?? 0,
    fetchMore
  }
}
