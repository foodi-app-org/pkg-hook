import { useQuery } from '@apollo/client'

import {
  GET_CONFIGURATION_EVENTS
} from './graphql/queries'
import {
  ConfigurationIdentity
} from './types/configuration.types'

export const useGetConfigurationEvents = (
  input: ConfigurationIdentity & {
    limit?: number
    offset?: number
  }
) => {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(
    GET_CONFIGURATION_EVENTS,
    {
      variables: {
        ...input,
        limit: input.limit ?? 50,
        offset: input.offset ?? 0
      },
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first'
    }
  )

  return {
    events: data?.getConfigurationEvents ?? [],
    loading,
    error,
    refetch
  }
}