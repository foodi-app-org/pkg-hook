import { useLazyQuery } from '@apollo/client'
import { GET_ONE_SALE } from './queries'

export const useGetSale = ({ callback = () => { return } } = {}) => {
  const [getOnePedidoStore, { 
    loading, 
    data, 
    called, 
    error
  }] = useLazyQuery(GET_ONE_SALE, {
    onCompleted: (res) => {
      if (res?.getOnePedidoStore) {
        return callback(res)
      }
    },
    onError: () => {
      return callback(null)
    }
  })
  return {
    data: data?.getOnePedidoStore, // actualizado aquí
    loading,
    error,
    called,
    getOnePedidoStore
  }
}
