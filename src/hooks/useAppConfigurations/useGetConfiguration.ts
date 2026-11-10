import { useQuery } from '@apollo/client'

import {
  GET_CONFIGURATION
} from './graphql/queries'
import {
  ConfigurationIdentity
} from './types/configuration.types'

export const useGetConfiguration = (
  input: ConfigurationIdentity
) => {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(GET_CONFIGURATION, {
    variables: input,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false
  })

  return {
    configuration: data?.getConfiguration ?? null,
    value: data?.getConfiguration?.value,
    loading,
    error,
    refetch
  }
}