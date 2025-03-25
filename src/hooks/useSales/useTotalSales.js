import { useApolloClient, useQuery } from '@apollo/client'
import { GET_ALL_COUNT_SALES } from './queries'

export const useTotalSales = () => {
  const client = useApolloClient()

  const { data, loading, error } = useQuery(GET_ALL_COUNT_SALES, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge'
  })

  // Guarda la respuesta en la caché manualmente (opcional)
  if (data) {
    client.writeQuery({ query: GET_ALL_COUNT_SALES, data })
  }

  return [data?.getTodaySales || 0, {
    loading,
    error
  }]
}
