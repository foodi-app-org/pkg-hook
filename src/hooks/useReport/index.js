import { useQuery } from '@apollo/client'
import { GET_ALL_SALES, GET_ALL_TOTAL_SALES } from './queries'

export const useReport = ({
  more,
  fromDate,
  toDate
}) => {
  const { data, fetchMore, loading } = useQuery(GET_ALL_SALES,{
    fetchPolicy: 'network-only',
    variables: {
        min: 0,
        fromDate,
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
  // console.log({totalSales})

  return {
    data,
    loading,
    totalSales: totalSales?.getAllSalesStoreTotal.TOTAL ?? 0,
    restaurant: totalSales?.getAllSalesStoreTotal.restaurant ?? 0,
    delivery: totalSales?.getAllSalesStoreTotal.delivery ?? 0,
    fetchMore
  }
}
