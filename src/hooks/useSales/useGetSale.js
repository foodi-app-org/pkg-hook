import { useLazyQuery } from '@apollo/client'
import { GET_ONE_SALE } from './queries'

export const useGetSale = () => {
  const [getOnePedidoStore, { loading, data, called, error }] = useLazyQuery(GET_ONE_SALE)
  return {
    data: data?.getOnePedidoStore,
    loading,
    error,
    called,
    getOnePedidoStore
  }
}
