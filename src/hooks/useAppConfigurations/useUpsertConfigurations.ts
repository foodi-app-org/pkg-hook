import { useMutation } from '@apollo/client'
import { useCallback } from 'react'


import {
  UPSERT_CONFIGURATIONS
} from './graphql/mutations'
import { writeConfigurationCache } from './helper/configuration-cache'
import { UpsertConfigurationInput } from './types/configuration.types'


export const useUpsertConfigurations = () => {
  const [
    mutate,
    {
      loading,
      error,
      reset
    }
  ] = useMutation(
    UPSERT_CONFIGURATIONS,
    {
      update(cache, result) {
        const response =
          result.data?.upsertConfigurations

        if (!response?.success) return

        response.data?.forEach((configuration: any) => {
          writeConfigurationCache(cache, configuration)
        })
      }
    }
  )

  const upsertConfigurations = useCallback(
    async (inputs: UpsertConfigurationInput[]) => {
      const result = await mutate({
        variables: { inputs }
      })

      const response =
        result.data?.upsertConfigurations

      if (!response) {
        throw new Error(
          'No se recibió respuesta al guardar las configuraciones'
        )
      }

      return response
    },
    [mutate]
  )

  return {
    upsertConfigurations,
    loading,
    error,
    reset
  }
}