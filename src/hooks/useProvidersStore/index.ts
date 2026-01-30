import { useQuery } from '@apollo/client'

import { GET_ALL_PROVIDERS } from './queries'

export const useProvidersStore = () => {
  const {
    data,
    fetchMore,
    loading,
    error,
    called
  } = useQuery(GET_ALL_PROVIDERS, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-first',
    refetchWritePolicy: 'merge'
  })
  const providerData = data?.getAllProviders || []
  return [providerData, {
    fetchMore,
    called,
    error,
    loading
  }]
}
