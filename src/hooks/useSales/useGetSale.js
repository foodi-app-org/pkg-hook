import { useLazyQuery } from '@apollo/client'
import { GET_ONE_SALE } from './queries'

export const useGetSale = () => {
  const [getOneSalesStore, { loading, data, called, error }] = useLazyQuery(GET_ONE_SALE)
  return {
    data: data?.getOneSalesStore,
    loading,
    error,
    called,
    getOneSalesStore
  }
}
