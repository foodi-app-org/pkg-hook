import { useMutation } from '@apollo/client'

import { DELETE_STORE } from './queries'

export interface DeleteStorePayload {
  success: boolean
  message: string
  idStore: string
  storesDeleted: number
  usersDeleted: number
}

interface DeleteStoreData {
  deleteStore: DeleteStorePayload
}

interface DeleteStoreVariables {
  idStore?: string | null
}

/**
 * Hook to permanently delete a store/tenant.
 *
 * Calls the `deleteStore` mutation which drops the tenant schema (all tables and
 * records) and removes the store and its associated user from the public schema,
 * so the commerce can be registered again from scratch.
 *
 * Destructive and irreversible. If `idStore` is omitted the backend falls back
 * to the store bound to the current session (restaurant header).
 *
 * @returns An object with the mutation trigger and its state.
 */
export function useDeleteStore () {
  const [deleteStoreMutation, { data, loading, error }] = useMutation<
    DeleteStoreData,
    DeleteStoreVariables
  >(DELETE_STORE)

  /**
   * Trigger the deletion.
   * @param idStore - UUID of the store to delete (optional).
   * @returns The DeleteStorePayload or null if nothing was returned.
   */
  const deleteStore = async (idStore?: string | null): Promise<DeleteStorePayload | null> => {
    const result = await deleteStoreMutation({ variables: { idStore } })
    return result.data?.deleteStore ?? null
  }

  return {
    deleteStore,
    data: data?.deleteStore ?? null,
    loading,
    error
  }
}
