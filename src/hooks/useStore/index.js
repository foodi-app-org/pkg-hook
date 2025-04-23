import { useState, useEffect } from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import { GET_ONE_STORE, GET_ONE_STORE_BY_ID } from './queries' // Reemplaza con la importación correcta de tu consulta
import { errorHandler } from '../../config/client'
import { useLogout } from '../useLogout'

export const useStore = ({ isClient = false, idStore = null, callback = () => {} } = {}) => {
  const client = useApolloClient()
  const [onClickLogout, { loading: load }] = useLogout()

  // Variables para almacenar los datos del store
  const [store, setStore] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Intentar leer los datos de la caché
  const cachedData = client.readQuery({ query: GET_ONE_STORE })

  useEffect(() => {
    if (cachedData) {
      const array = store ? Object.keys(store) : []
      // Comprobar si los datos de la caché ya están establecidos en el estado
      if ((!store || Array.isArray(array)) && array?.length === 0) {
        setStore(cachedData.getStore)
      }
    }
    callback(store)
  }, [cachedData, store])

  if (isClient && !!idStore) {
    const {
      data,
      refetch,
      loading: loadingClient,
      error: errorStoreClient
    } = useQuery(GET_ONE_STORE_BY_ID, {
      skip: !isClient,
      variables: {
        idStore
      }
    })

    const dataOneStoreClient = !loadingClient ? data?.getOneStore : {}

    return [dataOneStoreClient, {
      refetch,
      loading: loadingClient,
      error: errorStoreClient
    }]
  } else {
    const { loading: loadingServer } = useQuery(GET_ONE_STORE, {
      skip: isClient && !idStore,
      variables: {
        idStore
      },
      fetchPolicy: 'cache-first',
      onCompleted: (data) => {
        const { getStore } = data || {}
        setStore(getStore)
        setLoading(false)
      },
      onError: (err) => {
        if (err.networkError && err.networkError.result) {
          const response = errorHandler(err.networkError.result)
          if (response) {
            onClickLogout()
          }
        }
        setError(err)
        setLoading(false)
      }
    })

    return [store, { loading: load || loadingServer || loading, error }]
  }
}
