import { useMutation } from '@apollo/client'

import { CREATE_STORE_PENDING_TO_REGISTER } from './queries'

/**
 * Hook to create a store pending to register.
 *
 * @returns An object containing the mutation function and its state.
 */
export function useCreateStorePendingToRegister () {
  const [createStorePendingToRegister, { data, loading, error }] = useMutation(CREATE_STORE_PENDING_TO_REGISTER)

  return {
    createStorePendingToRegister,
    data,
    loading,
    error
  }
}
