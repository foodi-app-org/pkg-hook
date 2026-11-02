import { useMutation } from '@apollo/client'

import { DELETE_STORE } from './queries'

/**
 * Shape of the payload returned by the `deleteStore` mutation.
 */
export interface DeleteStorePayload {
  success: boolean
  message?: string
  idStore?: string
  storesDeleted: number
  usersDeleted: number
}

interface DeleteStoreResponse {
  deleteStore: DeleteStorePayload
}

interface DeleteStoreVariables {
  idStore?: string
}

/**
 * Hook to permanently delete a store (tenant) and all of its data.
 *
 * It calls the `deleteStore` GraphQL mutation which drops the tenant schema
 * (every table + record) and removes the store and its associated user from
 * the public schema, allowing the commerce to be registered again from
 * scratch.
 *
 * This action is destructive and irreversible, so it should always be
 * triggered behind a confirmation step (see `DeleteStoreConfirm`).
 *
 * @returns A tuple `[deleteStore, { data, loading, error, called }]` where
 * `deleteStore` resolves to the `DeleteStorePayload`.
 */
export const useDeleteStore = () => {
  const [mutate, { data, loading, error, called }] = useMutation<
    DeleteStoreResponse,
    DeleteStoreVariables
  >(DELETE_STORE)

  /**
   * Executes the deletion.
   *
   * @param idStore - Optional UUID of the store/tenant to delete. When omitted
   * the backend uses the store bound to the current session.
   * @returns The `DeleteStorePayload` or `undefined` if no data was returned.
   */
  const deleteStore = async (idStore?: string): Promise<DeleteStorePayload | undefined> => {
    const response = await mutate({ variables: { idStore } })
    return response.data?.deleteStore
  }

  return { deleteStore, data, loading, error, called }
}
