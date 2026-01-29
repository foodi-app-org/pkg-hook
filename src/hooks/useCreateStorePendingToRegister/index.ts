import { useMutation } from '@apollo/client'
import { CREATE_STORE_PENDING_TO_REGISTER } from './queries'

export function useCreateStorePendingToRegister () {
  const [createStorePendingToRegister, { data, loading, error }] = useMutation(CREATE_STORE_PENDING_TO_REGISTER)

  return {
    createStorePendingToRegister,
    data,
    loading,
    error
  }
}
