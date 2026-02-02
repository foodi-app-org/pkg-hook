import { useMutation, ApolloCache, FetchResult } from '@apollo/client'

/**
 * Local override for SendNotificationFn type to include required properties.
 * Remove this if you can update the original type in 'typesdefs'.
 */
type SendNotificationArgs = {
  title: string
  backgroundColor: string
  description: string
}

import { updateCacheMod } from '../../utils'
import {
  // GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
  GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL
} from '../useProductsFood/queriesStore'

/**
 * Arguments required to execute the mutation
 */
export type HandleMutateArgs = {
  pId: string
  title: string
  listId: string
  id: string
  state?: number
}

/**
 * Input sent to the GraphQL mutation
 */
type UpdateExtProductSubOptionalInput = {
  pId: string
  OptionalSubProName: string
  exCodeOptionExtra: string
  exCode: string
  state: number
}

/**
 * Error object returned by the API
 */
type GraphQLErrorItem = {
  path?: string
  message?: string
  type?: string
  context?: Record<string, unknown>
}

/**
 * Mutation response shape
 */
type UpdateExtProductSubOptionalResponse = {
  updateExtProductSubOptional: {
    success: boolean
    message: string
    data?: unknown
    errors?: GraphQLErrorItem[]
  }
}

/**
 * Cache query response used in update()
 */
type ExtProductFoodsOptionalAllResponse = {
  ExtProductFoodsOptionalAll: unknown
}

/**
 * Hook for updating sub optional extras of food products
 */
export const useUpdateExtProductFoodsSubOptional = (
  {
    sendNotification = (args: SendNotificationArgs) => args
  }: {
    sendNotification?: (args: SendNotificationArgs) => void
  } = {}
) => {
  const [updateExtProductSubOptional] = useMutation<
    UpdateExtProductSubOptionalResponse,
    { input: UpdateExtProductSubOptionalInput }
  >(GET_EXTRAS_PRODUCT_FOOD_SUB_OPTIONAL, {
    onCompleted: (data) => {
      const result = data?.updateExtProductSubOptional ?? {
        success: false,
        message: 'No response from server',
        errors: []
      }

      const { success, message, errors } = result

      sendNotification?.({
        title: success ? 'Sub item creado' : 'Error',
        backgroundColor: success ? 'success' : 'error',
        description: message
      })

      for (const err of errors ?? []) {
        if (!err?.message) continue
        sendNotification?.({
          title: 'Error',
          backgroundColor: 'error',
          description: err.message
        })
      }
    }
  })

  /**
   * Executes the mutation with the provided arguments
   */
  const handleMutateExtProductFoodsSubOptional = ({
    pId,
    title,
    listId,
    id,
    state = 1
  }: HandleMutateArgs): void => {
    updateExtProductSubOptional({
      variables: {
        input: {
          pId,
          OptionalSubProName: title,
          exCodeOptionExtra: listId,
          exCode: id,
          state
        }
      },
      update: (
        cache: ApolloCache<unknown>,
        { data }: FetchResult<UpdateExtProductSubOptionalResponse>
      ) => {
        // If the mutation was successful and you want to refetch or update the cache,
        // you may need to refetch the relevant query or update the cache manually.
        // Here is an example assuming you want to refetch the GET_EXTRAS_PRODUCT_FOOD_OPTIONAL query:
        if (!data?.updateExtProductSubOptional?.success) return

        // Optionally, you can refetch or update the cache as needed.
        // For example, you might want to refetch the query:
        cache.modify({
          fields: {
            ExtProductFoodsOptionalAll: () => {
              // Invalidate or refetch the field as needed
              // Or call updateCacheMod if it is designed to handle this
              // Here is the original call, but you may need to adapt it:
              // updateCacheMod({ ... })
              // For now, just return undefined to force a refetch
              return undefined
            }
          }
        })
      }
    })
  }

  return {
    handleMutateExtProductFoodsSubOptional
  }
}
