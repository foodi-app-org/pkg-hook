import { useQuery } from '@apollo/client'

import {
  GET_CONFIGURATIONS
} from './graphql/queries'
import {
  ConfigurationScope
} from './types/configuration.types'

interface Params {
  scope: ConfigurationScope
  componentName?: string
  search?: string
  limit?: number
  offset?: number
}

export const useGetConfigurations = ({
  scope,
  componentName,
  search,
  limit = 100,
  offset = 0
}: Params) => {
  const {
    data,
    loading,
    error,
    refetch,
    fetchMore
  } = useQuery(GET_CONFIGURATIONS, {
    variables: {
      scope,
      componentName,
      search,
      limit,
      offset
    },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first'
  })

  return {
    configurations: data?.getConfigurations ?? [],
    loading,
    error,
    refetch,
    fetchMore
  }
}