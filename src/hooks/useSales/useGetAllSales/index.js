import { useQuery } from '@apollo/client'
import { GET_ALL_SALES_STATISTICS } from '../queries'

export const useGetAllSales = ({
  fromDate = '',
  toDate = ''
} = {}) => {
  const {
    data,
    loading,
    error
  } = useQuery(GET_ALL_SALES_STATISTICS, {
    fetchPolicy: 'cache-first',
    variables: {
      fromDate,
      toDate
    }
  })

  return {
    data: data?.getAllSalesStoreStatistic || [],
    error,
    loading
  }
}
