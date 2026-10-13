import { useQuery } from '@apollo/client'
import { useEffect, useRef, useState } from 'react'


import { errorHandler, ErrorWithErrors } from '../../config/client'
import { useLogout } from '../useLogout'

import { GET_ONE_STORE, GET_ONE_STORE_BY_ID } from './queries'

import type { IStore } from 'typesdefs/dist/hooks/hooks/useStore/types'

type UseStoreCallback = () => void

interface UseStoreOptions {
  isClient?: boolean
  idStore?: string | null
  callback?: UseStoreCallback
}

interface StoreQueryData {
  getStore: IStore
}

interface StoreByIdQueryData {
  getOneStore: IStore
}

interface StoreQueryVariables {
  idStore?: string | null
}

const EMPTY_STORE = {} as IStore
const NOOP: UseStoreCallback = () => {}

/**
 *
 * @param first
 * @param second
 */
function areStoreValuesEqual(
  first: Partial<IStore> | null | undefined,
  second: Partial<IStore> | null | undefined
): boolean {
  if (first === second) return true
  if (!first || !second) return false

  const firstRecord = first as unknown as Record<string, unknown>
  const secondRecord = second as unknown as Record<string, unknown>
  const firstKeys = Object.keys(firstRecord)
  const secondKeys = Object.keys(secondRecord)

  if (firstKeys.length !== secondKeys.length) return false

  return firstKeys.every((key) => {
    return Object.prototype.hasOwnProperty.call(secondRecord, key) &&
      Object.is(firstRecord[key], secondRecord[key])
  })
}

/**
 *
 * @param root0
 * @param root0.isClient
 * @param root0.idStore
 */
function useStoreServer({
  isClient,
  idStore
}: Pick<UseStoreOptions, 'isClient' | 'idStore'>) {
  return useQuery<StoreQueryData, StoreQueryVariables>(GET_ONE_STORE, {
    skip: Boolean(isClient && idStore),
    variables: { idStore },
    fetchPolicy: 'cache-first'
  })
}

/**
 *
 * @param data
 * @param loading
 */
function getClientStore(
  data: StoreByIdQueryData | undefined,
  loading: boolean
): IStore {
  if (loading) return EMPTY_STORE
  return data?.getOneStore ?? EMPTY_STORE
}

/**
 *
 * @param store
 * @param loading
 * @param error
 * @param refetch
 */
function getServerStoreState(
  store: IStore,
  loading: boolean,
  error: Error | null,
  refetch: () => Promise<unknown>
): readonly [IStore, { loading: boolean; error: Error | null; refetch: () => Promise<unknown> }] {
  return [store, { loading, error, refetch }] as const
}

export const useStore = ({
  isClient = false,
  idStore = null,
  callback = NOOP
}: UseStoreOptions = {}): readonly [
  IStore,
  { loading: boolean; error: Error | null; refetch?: (...args: any[]) => any }
] => {
  const shouldUseClientStore = Boolean(isClient && idStore)
  const { onClickLogout, loading: logoutLoading } = useLogout()

  const [store, setStore] = useState<IStore>(EMPTY_STORE)
  const callbackRef = useRef<UseStoreCallback>(callback)
  const logoutRef = useRef(onClickLogout)
  const lastProcessedStoreRef = useRef<IStore | null>(null)

  // Mantiene las funciones actuales sin obligar a los efectos de datos a ejecutarse
  // de nuevo cada vez que el componente padre crea callbacks nuevos.
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    logoutRef.current = onClickLogout
  }, [onClickLogout])

  const {
    data: dataServer,
    loading: loadingServer,
    error: errorStoreServer,
    refetch: refetchServer
  } = useStoreServer({ isClient, idStore })

  const {
    data: dataClient,
    refetch: refetchClient,
    loading: loadingClient,
    error: errorStoreClient
  } = useQuery<StoreByIdQueryData, StoreQueryVariables>(GET_ONE_STORE_BY_ID, {
    skip: !shouldUseClientStore,
    variables: { idStore }
  })

  // Actualiza el estado únicamente después de que React haya montado el hook.
  // No se actualiza estado desde onCompleted/onError de Apollo.
  useEffect(() => {
    if (shouldUseClientStore) return

    const nextStore = dataServer?.getStore
    if (!nextStore) return

    setStore((currentStore) => {
      return areStoreValuesEqual(currentStore, nextStore) ? currentStore : nextStore
    })

    const previousStore = lastProcessedStoreRef.current
    if (!areStoreValuesEqual(previousStore, nextStore)) {
      lastProcessedStoreRef.current = nextStore
      callbackRef.current()
    }
  }, [dataServer, shouldUseClientStore])

  // Los errores también se procesan en un efecto, no desde callbacks de la consulta.
  useEffect(() => {
    if (shouldUseClientStore || !errorStoreServer) return

    const networkError = (
      errorStoreServer as unknown as { networkError?: { bodyText?: string } }
    )?.networkError

    if (networkError && typeof networkError.bodyText === 'string') {
      const response = errorHandler(
        networkError.bodyText as unknown as ErrorWithErrors
      )

      if (response) logoutRef.current()
    }
  }, [errorStoreServer, shouldUseClientStore])

  if (shouldUseClientStore) {
    const clientStore = getClientStore(dataClient, loadingClient)

    return [clientStore, {
      loading: loadingClient,
      error: (errorStoreClient as Error | null) ?? null,
      refetch: refetchClient
    }] as const
  }

  return getServerStoreState(
    dataServer?.getStore ?? store,
    Boolean(logoutLoading || loadingServer),
    (errorStoreServer as Error | null) ?? null,
    refetchServer as () => Promise<unknown>
  )
}
