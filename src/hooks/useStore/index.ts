import { useApolloClient, useQuery } from '@apollo/client'
import { useState, useEffect } from 'react'
import { IStore } from 'typesdefs/dist/hooks/hooks/useStore/types'

import { errorHandler, ErrorWithErrors } from '../../config/client'
import { useLogout } from '../useLogout'

import { GET_ONE_STORE, GET_ONE_STORE_BY_ID } from './queries' // Reemplaza con la importación correcta de tu consulta


type UseStoreCallback = () => void

interface UseStoreOptions {
  isClient?: boolean
  idStore?: string | null
  callback?: UseStoreCallback
}

/**
 *
 * @param isClient
 * @param idStore
 * @param callback
 * @param setStore
 * @param setLoading
 * @param setError
 * @param onClickLogout
 * @returns {*}
 */
interface UseStoreServerParams {
  isClient: boolean;
  idStore: string | null;
  callback: UseStoreCallback;
  setStore: React.Dispatch<React.SetStateAction<IStore>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  onClickLogout: () => void;
}

/**
 *
 * @param root0
 * @param root0.isClient
 * @param root0.idStore
 * @param root0.callback
 * @param root0.setStore
 * @param root0.setLoading
 * @param root0.setError
 * @param root0.onClickLogout
 * @returns {*}
 */
function useStoreServer({
  isClient,
  idStore,
  callback,
  setStore,
  setLoading,
  setError,
  onClickLogout
}: UseStoreServerParams) {
  return useQuery(GET_ONE_STORE, {
    skip: isClient && Boolean(idStore),
    variables: { idStore },
    fetchPolicy: 'cache-first',
    onCompleted: (data: { getStore: IStore }) => {
      const { getStore } = data || {}
      setStore(getStore)
      setLoading(false)
      callback()
    },
    onError: (err: unknown) => {
      const networkError = (err as { networkError?: { bodyText?: string } })?.networkError
      if (networkError && typeof networkError.bodyText === 'string') {
        const response = errorHandler(networkError.bodyText as unknown as ErrorWithErrors)
        if (response) {
          onClickLogout()
        }
      }
      setError(err as Error)
      setLoading(false)
    }
  })
}

/**
 *
 * @param cachedData
 * @param store
 * @param setStore
 * @param callback
 */
function useCachedStore(
  cachedData: { getStore: IStore } | null | undefined,
  store: IStore,
  setStore: React.Dispatch<React.SetStateAction<IStore>>,
  callback: UseStoreCallback
) {
  useEffect(() => {
    if (cachedData) {
      const array = store ? Object.keys(store) : []
      if ((!store || Array.isArray(array)) && array?.length === 0) {
        setStore(cachedData.getStore)
      }
    }
    callback()
  }, [cachedData, store])
}

/**
 *
 * @param isClient
 * @param idStore
 * @param refetchClient
 * @param loadingClient
 * @param errorStoreClient
 * @param dataClient
 * @returns {*}
 */
function useStoreClient(
  isClient: boolean,
  idStore: string | null,
  refetchClient: any,
  loadingClient: boolean,
  errorStoreClient: Error | null,
  dataClient: any
): readonly [IStore, { loading: boolean; error: Error | null; refetch?: typeof refetchClient }] {
  const dataOneStoreClient = loadingClient ? {} : dataClient?.getOneStore
  return [dataOneStoreClient, {
    loading: loadingClient,
    error: errorStoreClient,
    refetch: refetchClient
  }] as const
}

/**
 *
 * @param store
 * @param load
 * @param loadingServer
 * @param loading
 * @param errorStoreServer
 * @param error
 * @returns {*}
 */
function useStoreServerReturn(
  store: IStore,
  load: boolean,
  loadingServer: boolean,
  loading: boolean,
  errorStoreServer: Error | null,
  error: Error | null
): readonly [IStore, { loading: boolean; error: Error | null }] {
  return [store, { loading: load || loadingServer || loading, error: errorStoreServer || error }] as const
}

export const useStore = ({
  isClient = false,
  idStore = null,
  callback = (() => {}) as UseStoreCallback
}: UseStoreOptions = {}): readonly [IStore, { loading: boolean; error: Error | null; refetch?: any }] => {
  const client = useApolloClient()
  const { onClickLogout, loading: load } = useLogout()

  const [store, setStore] = useState<IStore>({} as IStore)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cachedData = client.readQuery<{ getStore: IStore }>({ query: GET_ONE_STORE })
  const {
    data: dataClient,
    refetch: refetchClient,
    loading: loadingClient,
    error: errorStoreClient
  } = useQuery(GET_ONE_STORE_BY_ID, {
    skip: !isClient || !idStore,
    variables: { idStore }
  })

  const {
    loading: loadingServer,
    error: errorStoreServer
  } = useStoreServer({
    isClient,
    idStore,
    callback,
    setStore,
    setLoading,
    setError,
    onClickLogout
  })

  useCachedStore(cachedData, store, setStore, callback)

  if (isClient && idStore) {
    return useStoreClient(isClient, idStore, refetchClient, loadingClient, errorStoreClient as Error | null, dataClient)
  }

  return useStoreServerReturn(store, load, loadingServer, loading, errorStoreServer as Error | null, error)
}
