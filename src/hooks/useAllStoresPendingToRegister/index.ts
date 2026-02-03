import { gql, useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

export const GET_ALL_STORES_PENDING_TO_REGISTER = gql`
  query GetAllStoresPendingToRegister {
    getAllStoresPendingToRegister {
        StorePendingToRegisterId
    UserId
    UserEmail
    StoreNumber
    createAt
    updateAt
    }
  }
`

/**
 * Hook to fetch all stores pending to register.
 *
 * @returns An object containing loading state, stores data, and any fetch error.
 */
export function useAllStoresPendingToRegister() {
  const { loading, error, data } = useQuery(GET_ALL_STORES_PENDING_TO_REGISTER)

  const [stores, setStores] = useState([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && data) {
      setStores(data.getAllStoresPendingToRegister)
    }

    if (error) {
      setFetchError(error.message as string)
    }
  }, [loading, data, error])

  return { loading, stores, fetchError }
}
