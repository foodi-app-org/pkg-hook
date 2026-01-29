import { useQuery } from '@apollo/client'
import { GET_ALL_PEDIDOS_STATUS } from './queries'
import { filterOrders } from './helpers'

export const useStatusOrdersClient = () => {
  const { data, loading, error } = useQuery(GET_ALL_PEDIDOS_STATUS, {
    pollInterval: 60000,
    fetchPolicy: 'cache-and-network',
    onError: () => {}
  })

  return {
    data: loading ? [] : filterOrders(data?.getAllPedidoUserFinal || []),
    loading,
    error
  }
}
