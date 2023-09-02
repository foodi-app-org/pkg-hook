import { useState, useEffect } from 'react'
import { useApolloClient, useQuery } from '@apollo/client'
import { GET_ONE_STORE, GET_ONE_STORE_BY_ID } from './queries' // Reemplaza con la importación correcta de tu consulta
import { errorHandler } from '../../config/client'
import { useLogout } from '../useLogout'

export const useStore = ({ isClient = false, idStore = '' } = {}) => {
  const { data, refetch, loading: loadingClient, error: errorStoreClient } = useQuery(GET_ONE_STORE_BY_ID, {
    skip: !isClient,
    variables: {
      idStore
    }
  })

  const [store, setStore] = useState({})
  const client = useApolloClient()
  const [onClickLogout, { loading: load }] = useLogout()

  // Intentar leer los datos de la caché
  const cachedData = client.readQuery({ query: GET_ONE_STORE })

  useEffect(() => {
    if (cachedData) {
      // Comprobar si los datos de la caché ya están establecidos en el estado
      if (!store || Object.keys(store).length === 0) {
        setStore(cachedData.getStore)
      }
    }
  }, [cachedData, store])

  const { loading, error } = useQuery(GET_ONE_STORE, {
    skip: isClient,
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      const { getStore } = data || {}
      setStore(getStore)
    },
    onError: (err) => {
      if (err.networkError && err.networkError.result) {
        const response = errorHandler(err.networkError.result)
        if (response) {
          onClickLogout()
        }
      }
    }
  })

  // Ejecutar la consulta y almacenarla en la caché
  useEffect(() => {
    client.query({ query: GET_ONE_STORE }).then(() => {
      // Leer la consulta desde la caché
      const cacheData = client.readQuery({ query: GET_ONE_STORE })
      setStore(cacheData?.getStore)
    })
  }, [client])

  // Actualizar manualmente la caché después de cada petición exitosa
  useEffect(() => {
    if (!loading && !error && !cachedData) {
      client.writeQuery({
        query: GET_ONE_STORE,
        data: { getStore: store }
      })
    }
  }, [loading, error, cachedData, client, store])

  if (isClient) {
    const dataOneStoreClient = !loadingClient ? data?.getOneStore : {}
    return [dataOneStoreClient, {
      refetch,
      loading: loadingClient,
      error: errorStoreClient
    }]
  }
  return [store, { loading: load || loading, error }]
}
