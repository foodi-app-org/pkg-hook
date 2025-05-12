import { useLazyQuery } from '@apollo/client'
import { GET_ONE_SALE } from './queries'

export const useGetSale = () => {
  const [getStoreOrderById, { loading, data, called, error }] = useLazyQuery(GET_ONE_SALE)
  return {
    data: data?.getStoreOrderById,
    loading,
    error,
    called,
    getStoreOrderById
  }
}
