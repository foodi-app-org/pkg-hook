import { useQuery } from '@apollo/client'

import {
  GET_RESOLVED_CONFIGURATION
} from './graphql/queries'

interface Params {
  componentName: string
  key: string
  defaultValue?: unknown
}

export const useGetResolvedConfiguration = ({
  componentName,
  key,
  defaultValue
}: Params) => {
  const {
    data,
    loading,
    error,
    refetch
  } = useQuery(
    GET_RESOLVED_CONFIGURATION,
    {
      variables: {
        componentName,
        key
      },
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first'
    }
  )

  const configuration =
    data?.getResolvedConfiguration ?? null

  return {
    configuration,
    value: configuration?.value ?? defaultValue,
    sourceScope: configuration?.sourceScope ?? null,
    loading,
    error,
    refetch
  }
}