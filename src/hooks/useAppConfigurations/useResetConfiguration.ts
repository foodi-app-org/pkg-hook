import { useMutation } from '@apollo/client'
import { useCallback } from 'react'

import {
  RESET_CONFIGURATION
} from './graphql/mutations'
import {
  GET_CONFIGURATION
} from './graphql/queries'
import { ConfigurationIdentity } from './types/configuration.types'



export const useResetConfiguration = () => {
  const [
    mutate,
    {
      loading,
      error,
      reset
    }
  ] = useMutation(
    RESET_CONFIGURATION,
    {
      update(cache, result, options) {
        const response =
          result.data?.resetConfiguration

        if (!response?.success) return

        const variables = options.variables

        if (!variables) return

        const identity = {
          scope: variables.scope,
          componentName: variables.componentName,
          key: variables.key
        }

        cache.writeQuery({
          query: GET_CONFIGURATION,
          variables: identity,
          data: {
            getConfiguration: null
          }
        })

        // The effective setting may now come from another scope.
        // Evict it so active watchers can resolve the new value.
        cache.evict({
          id: 'ROOT_QUERY',
          fieldName: 'getResolvedConfiguration',
          args: {
            componentName: identity.componentName,
            key: identity.key
          }
        })

        cache.gc()

        // Apollo will refresh active watchers for this field.
        // Identical operation/variables are deduplicated.
      }
    }
  )

  const resetConfiguration = useCallback(
    async (input: ConfigurationIdentity) => {
      const result = await mutate({
        variables: input
      })

      const response =
        result.data?.resetConfiguration

      if (!response) {
        throw new Error(
          'No se recibió respuesta al restablecer la configuración'
        )
      }

      return response
    },
    [mutate]
  )

  return {
    resetConfiguration,
    loading,
    error,
    reset
  }
}