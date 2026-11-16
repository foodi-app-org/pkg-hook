import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { gql } from '@apollo/client'

import { useOrderStatusTypes } from '../useOrderStatusTypes'

import type {
  OrderStatusType
} from '../useOrderStatusTypes'

import type {
  ApolloClient,
  NormalizedCacheObject
} from '@apollo/client'

import type { SendNotificationFn } from 'typesdefs'

const MAX_RECENT_ORDERS = 100
const MAX_PROCESSED_EVENTS = 500

/**
 * Lightweight query used to hydrate incoming events.
 * Avoid fetching products and financial details.
 */
const GET_REALTIME_ORDER = gql`
  query GetRealtimeOrder($pCodeRef: String!) {
    getOneSalesStore(pCodeRef: $pCodeRef) {
      success
      message
      data {
        id
        idStore
        pCodeRef
        createdAt
        updatedAt
        pSState
        channel
        statusOrder {
          idStatus
          name
          description
          priority
          state
          backgroundColor
          color
          createdAt
          updatedAt
          __typename
        }
      }
    }
  }
`

export interface OrderEvent {
  id: string
  idStore: string
  pCodeRef: string
}

export type OrderSyncState =
  | 'loading'
  | 'synced'
  | 'error'

export interface StoreOrder extends OrderEvent {
  createdAt?: string
  updatedAt?: string
  pDatCre?: string
  receivedAt: string
  pSState?: string | number
  channel?: number
  status?: string
  statusOrder?: OrderStatusType | null
  syncState: OrderSyncState
  view?: boolean
}

interface OrderDetailResponse {
  getOneSalesStore: {
    success: boolean
    message?: string
    data?: Partial<StoreOrder> | null
  }
}

interface OrderDetailVariables {
  pCodeRef: string
}

interface UseManageNewOrderProps {
  client: ApolloClient<NormalizedCacheObject>
  idStore?: string
  setIsOpenOrder?: (value: boolean) => void
  setCountOrders?: (value: number) => void
  sendNotification?: SendNotificationFn
  playNotificationSound?: () => void
}

interface RecentOrdersState {
  idStore: string
  orders: StoreOrder[]
}

interface StoreScope {
  active: boolean
  generation: number
  processed: Set<string>
  pending: Map<string, Promise<void>>
}

function normalizeStatus(value?: string): string {
  return String(value ?? '').trim().toUpperCase()
}

function getOrderKey(order: OrderEvent): string {
  return `${order.idStore}:${order.pCodeRef}`
}

function getOrderTime(order: StoreOrder): number {
  const time = Date.parse(order.receivedAt)

  return Number.isFinite(time) ? time : 0
}

export const useManageNewOrder = ({
  client,
  idStore = '',
  setIsOpenOrder,
  setCountOrders,
  sendNotification,
  playNotificationSound
}: UseManageNewOrderProps) => {
  const {
    data: statusTypes,
    loading: loadingStatusTypes,
    error: statusTypesError,
    refetch: refetchStatusTypes
  } = useOrderStatusTypes()

  const [recentState, setRecentState] =
    useState<RecentOrdersState>({
      idStore,
      orders: []
    })

  // Each store owns its own event processing scope.
  const scope = useMemo<StoreScope>(() => ({
    active: true,
    generation: 0,
    processed: new Set(),
    pending: new Map()
  }), [idStore, client])

  const ordersRef = useRef<StoreOrder[]>([])

  useEffect(() => {
    scope.active = true

    return () => {
      scope.active = false
      scope.generation += 1
      scope.processed.clear()
      scope.pending.clear()
    }
  }, [scope])

  useEffect(() => {
    setRecentState(previous => {
      if (previous.idStore === idStore) {
        return previous
      }

      return {
        idStore,
        orders: []
      }
    })
  }, [idStore])

  // --------------------------------------------------
  // Dynamic status catalog.
  // --------------------------------------------------

  const statusCatalog = useMemo(() => {
    const byId = new Map<string, OrderStatusType>()
    const byName = new Map<string, OrderStatusType>()

    for (const status of statusTypes ?? []) {
      byId.set(status.idStatus, status)

      byName.set(
        normalizeStatus(status.name),
        status
      )
    }

    return { byId, byName }
  }, [statusTypes])

  // --------------------------------------------------
  // Resolve official metadata from the backend.
  // --------------------------------------------------

  const orders = useMemo(() => {
    if (recentState.idStore !== idStore) {
      return []
    }

    return recentState.orders
      .map(order => {
        const currentStatus = order.statusOrder

        const resolvedStatus =
          (
            currentStatus?.idStatus
              ? statusCatalog.byId.get(
                  currentStatus.idStatus
                )
              : undefined
          ) ??
          statusCatalog.byName.get(
            normalizeStatus(
              currentStatus?.name ?? order.status
            )
          ) ??
          currentStatus ??
          null

        return {
          ...order,
          pDatCre:
            order.createdAt ??
            order.receivedAt,

          status: resolvedStatus?.name,

          statusOrder: resolvedStatus
        }
      })
      .sort(
        (a, b) => getOrderTime(b) - getOrderTime(a)
      )
  }, [
    recentState,
    idStore,
    statusCatalog
  ])

  useEffect(() => {
    ordersRef.current = orders
    setCountOrders?.(orders.length)
  }, [orders, setCountOrders])

  // --------------------------------------------------
  // Update a single order without replacing the inbox.
  // --------------------------------------------------

  const updateOrder = useCallback((
    pCodeRef: string,
    patch: Partial<StoreOrder>
  ) => {
    setRecentState(previous => {
      if (previous.idStore !== idStore) {
        return previous
      }

      return {
        ...previous,
        orders: previous.orders.map(order =>
          order.pCodeRef === pCodeRef
            ? {
                ...order,
                ...patch
              }
            : order
        )
      }
    })
  }, [idStore])

  // --------------------------------------------------
  // Hydrate one order using Apollo.
  // --------------------------------------------------

  const hydrateOrder = useCallback((
    event: OrderEvent
  ): Promise<void> => {
    if (
      !scope.active ||
      event.idStore !== idStore
    ) {
      return Promise.resolve()
    }

    const key = getOrderKey(event)

    const existing = scope.pending.get(key)

    if (existing) return existing

    const generation = scope.generation

    const isCurrent = () =>
      scope.active &&
      scope.generation === generation

    updateOrder(event.pCodeRef, {
      syncState: 'loading'
    })

    const request = Promise.resolve()
      .then(async () => {
        if (!isCurrent()) return

        const response = await client.query<
          OrderDetailResponse,
          OrderDetailVariables
        >({
          query: GET_REALTIME_ORDER,

          variables: {
            pCodeRef: event.pCodeRef
          },

          fetchPolicy: 'network-only',
          errorPolicy: 'none'
        })

        if (!isCurrent()) return

        const result =
          response.data?.getOneSalesStore

        const detail = result?.data

        if (!result?.success || !detail) {
          throw new Error(
            result?.message ??
            'No se encontró la orden'
          )
        }

        if (
          detail.idStore !== idStore ||
          detail.pCodeRef !== event.pCodeRef
        ) {
          throw new Error(
            'La orden no coincide con el evento'
          )
        }

        updateOrder(event.pCodeRef, {
          ...detail,

          // Preserve the realtime identity.
          id: event.id,
          idStore: event.idStore,
          pCodeRef: event.pCodeRef,

          syncState: 'synced'
        })
      })
      .catch(error => {
        if (!isCurrent()) return

        updateOrder(event.pCodeRef, {
          syncState: 'error'
        })

        console.error(
          '[ManageNewOrder] Synchronization failed',
          error
        )
      })
      .finally(() => {
        if (scope.pending.get(key) === request) {
          scope.pending.delete(key)
        }
      })

    scope.pending.set(key, request)

    return request
  }, [
    client,
    scope,
    idStore,
    updateOrder
  ])

  // --------------------------------------------------
  // Incoming WebSocket event.
  // --------------------------------------------------

  const handleNewOrder = useCallback((
    event: OrderEvent
  ): void => {
    if (
      !scope.active ||
      !idStore ||
      !event?.pCodeRef ||
      event.idStore !== idStore
    ) {
      return
    }

    const key = getOrderKey(event)

    if (scope.processed.has(key)) return

    scope.processed.add(key)

    if (
      scope.processed.size >
      MAX_PROCESSED_EVENTS
    ) {
      const oldest =
        scope.processed.values().next().value

      if (oldest !== undefined) {
        scope.processed.delete(oldest)
      }
    }

    const timestamp = new Date().toISOString()

    const incomingOrder: StoreOrder = {
      ...event,
      receivedAt: timestamp,
      pDatCre: timestamp,
      statusOrder: null,
      syncState: 'loading',
      view: true
    }

    setRecentState(previous => {
      const current =
        previous.idStore === idStore
          ? previous.orders
          : []

      return {
        idStore,
        orders: [
          incomingOrder,
          ...current.filter(order =>
            order.pCodeRef !== event.pCodeRef
          )
        ].slice(0, MAX_RECENT_ORDERS)
      }
    })

    // Open immediately, without waiting for HTTP.
    setIsOpenOrder?.(true)

    void hydrateOrder(event)

    sendNotification?.({
      title: 'Nueva orden',
      description: `Pedido #${event.pCodeRef}`,
      backgroundColor: 'success'
    })

    try {
      playNotificationSound?.()
    } catch (error) {
      console.warn(
        '[ManageNewOrder] Sound failed',
        error
      )
    }
  }, [
    scope,
    idStore,
    setIsOpenOrder,
    hydrateOrder,
    sendNotification,
    playNotificationSound
  ])

  // --------------------------------------------------
  // Manual synchronization.
  // --------------------------------------------------

  const refreshOrders = useCallback(async () => {
    const current = ordersRef.current.filter(
      order => order.idStore === idStore
    )

    await Promise.allSettled([
      refetchStatusTypes(),

      // Refresh known orders in small batches.
      (async () => {
        const batchSize = 4

        for (
          let index = 0;
          index < current.length;
          index += batchSize
        ) {
          if (!scope.active) break

          await Promise.allSettled(
            current
              .slice(index, index + batchSize)
              .map(hydrateOrder)
          )
        }
      })()
    ])
  }, [
    idStore,
    scope,
    hydrateOrder,
    refetchStatusTypes
  ])

  const retryOrder = useCallback((
    pCodeRef: string
  ) => {
    const order = ordersRef.current.find(item =>
      item.idStore === idStore &&
      item.pCodeRef === pCodeRef
    )

    if (!order) return Promise.resolve()

    return hydrateOrder(order)
  }, [idStore, hydrateOrder])

  return [
    orders,
    {
      handleNewOrder,
      refreshOrders,
      retryOrder,
      statusTypes,
      loadingStatusTypes,
      statusTypesError
    }
  ] as const
}