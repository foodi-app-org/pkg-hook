import {
  useMutation
} from '@apollo/client'
import {
  useCallback
} from 'react'


import {
  UPSERT_CONFIGURATION
} from './graphql/mutations'
import { writeConfigurationCache } from './helper/configuration-cache'
import {
  UpsertConfigurationInput,
  ConfigurationMutationResponse
} from './types/configuration.types'

export const useUpsertConfiguration = () => {
  const [
    mutate,
    {
      loading,
      error,
      reset
    }
  ] = useMutation(
    UPSERT_CONFIGURATION,
    {
      update(cache, result) {
        const response =
          result.data?.upsertConfiguration

        const configuration = response?.data

        if (
          response?.success &&
          configuration
        ) {
          writeConfigurationCache(
            cache,
            configuration
          )
        }
      }
    }
  )

  const upsertConfiguration = useCallback(
    async (
      input: UpsertConfigurationInput
    ): Promise<ConfigurationMutationResponse> => {
      const result = await mutate({
        variables: { input }
      })

      const response =
        result.data?.upsertConfiguration

      if (!response) {
        throw new Error(
          'No se recibió respuesta al guardar la configuración'
        )
      }

      return response
    },
    [mutate]
  )

  return {
    upsertConfiguration,
    loading,
    error,
    reset
  }
}