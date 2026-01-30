import { useLazyQuery } from '@apollo/client'

import { GET_ONE_SALE } from './queries'

export const useGetSale = () => {
  const [getOneSalesStore, { loading, data, called, error }] = useLazyQuery(GET_ONE_SALE)

  const handleGetSale = async (pCodeRef) => {
    return await getOneSalesStore({
      variables: { pCodeRef }
    })
  }
  return {
    data: data?.getOneSalesStore,
    loading,
    error,
    called,
    getOneSalesStore,
    handleGetSale
  }
}
