import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  DEFAULT_PENDING_ORDERS_STORAGE_KEY,
  readPendingOrders,
  writePendingOrders
} from './helpers/pending-orders.storage'

import type {
  CreatePendingOrderParams,
  PendingOrder,
  PendingOrderChanges,
  PendingOrderStatus,
  UsePendingOrdersOptions
} from './types/pending-orders.types'

const ACTIVE_STATUSES: PendingOrderStatus[] = ['PENDING', 'IN_PROGRESS']
const VALID_STATUSES: PendingOrderStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]


const cloneSnapshot = <T,>(value: T): T => {
  return JSON.parse(JSON.stringify(value)) as T
}

const createPendingOrderId = (): string => {
  const randomPart = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `pending_${Date.now()}_${randomPart}`
}

const createPendingTicket = (): string => {
  const timePart = Date.now().toString(36).slice(-5).toUpperCase()
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `ESP-${timePart}${randomPart}`
}


const toSafeMoney = (value: number): number => {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : 0
}

/**
 * Manages pending POS orders independently from the sales reducer.
 * Local storage updates are synchronous and transactional: a failed write does
 * not update the in-memory list, allowing callers to keep the current cart.
 *
 * @param {UsePendingOrdersOptions} options - Hook options and persistence adapter.
 * @returns {object} Pending-order state, lifecycle actions and persistence action.
 */
export const usePendingOrders = ({
  onError,
  persistence,
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
}: UsePendingOrdersOptions = {}) => {
  const ordersRef = useRef<PendingOrder[]>([])
  const [pendingOrders, setPendingOrdersState] = useState<PendingOrder[]>([])
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null)
  const isHydrated = hydratedStorageKey === storageKey

  useEffect(() => {
    const storedOrders = readPendingOrders(storageKey)
    ordersRef.current = storedOrders
    setPendingOrdersState(storedOrders)
    setHydratedStorageKey(storageKey)
  }, [storageKey])

  /** Commits to storage before publishing the new state. */
  const commitOrders = useCallback(
    (nextOrders: PendingOrder[]): boolean => {
      if (!isHydrated) {
        onError?.('La lista de espera todavía se está cargando. Intenta nuevamente.')
        return false
      }

      const saved = writePendingOrders(nextOrders, storageKey)
      if (!saved) {
        onError?.('No fue posible guardar la lista de espera en este dispositivo. La venta actual se conserva.')
        return false
      }

      ordersRef.current = nextOrders
      setPendingOrdersState(nextOrders)
      return true
    },
    [isHydrated, onError, storageKey]
  )

  /**
   * Creates and saves an order snapshot without touching the current cart.
   *
   * @param {CreatePendingOrderParams} params - Snapshot data.
   * @returns {PendingOrder | null} Created order, or null when validation/storage fails.
   */
  const savePendingOrder = useCallback(
    (params: CreatePendingOrderParams): PendingOrder | null => {
      if (!params || !Array.isArray(params.products) || params.products.length === 0) {
        onError?.('No puedes enviar una venta vacía a la lista de espera.')
        return null
      }

      if (!params.values || typeof params.values !== 'object') {
        onError?.('Los datos de la venta no son válidos.')
        return null
      }

      if (!Number.isFinite(params.total) || params.total < 0) {
        onError?.('El total de la orden no es válido.')
        return null
      }

      let order: PendingOrder
      try {
        const now = new Date().toISOString()
        order = {
          id: createPendingOrderId(),
          ticket: createPendingTicket(),
          status: 'PENDING',
          products: cloneSnapshot(params.products),
          values: cloneSnapshot(params.values),
          discountType: params.discountType ?? null,
          discountPercent: Number.isFinite(params.discountPercent) && (params.discountPercent ?? 0) >= 0
            ? Number(params.discountPercent)
            : 0,
          discountAmount: toSafeMoney(params.discountAmount ?? 0),
          customer: params.customer ? cloneSnapshot(params.customer) : null,
          reference: params.reference?.trim() || '',
          total: toSafeMoney(params.total),
          createdAt: now,
          updatedAt: now,
          syncStatus: 'LOCAL'
        }
      } catch {
        onError?.('No fue posible preparar una copia segura de la orden. La venta actual se conserva.')
        return null
      }

      if (!commitOrders([...ordersRef.current, order])) return null
      return order
    },
    [commitOrders, onError]
  )

  /**
   * Resumes an order by moving it into the in-progress state.
   * Restoring the snapshot into the cart is handled by `useSales`.
   *
   * @param {string} orderId - Internal order ID.
   * @returns {PendingOrder | null} Updated order, or null when unavailable.
   */
  const resumePendingOrder = useCallback(
    (orderId: string): PendingOrder | null => {
      if (!orderId?.trim()) {
        onError?.('La orden pendiente no tiene un identificador válido.')
        return null
      }

      const existing = ordersRef.current.find((order) => order.id === orderId)
      if (!existing || !ACTIVE_STATUSES.includes(existing.status)) {
        onError?.('La orden pendiente no existe o ya no se puede retomar.')
        return null
      }

      const updated: PendingOrder = {
        ...existing,
        status: 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
        syncStatus: 'LOCAL'
      }

      const nextOrders = ordersRef.current.map((order) =>
        order.id === orderId ? updated : order
      )

      return commitOrders(nextOrders) ? updated : null
    },
    [commitOrders, onError]
  )

  /**
   * Physically removes one order from local storage and memory.
   *
   * @param {string} orderId - Internal order ID.
   * @returns {boolean} Whether the order was removed.
   */
  const removePendingOrder = useCallback(
    (orderId: string): boolean => {
      if (!orderId?.trim()) {
        onError?.('La orden pendiente no tiene un identificador válido.')
        return false
      }

      const currentOrders = ordersRef.current
      if (!currentOrders.some((order) => order.id === orderId)) {
        onError?.('La orden pendiente no existe.')
        return false
      }

      return commitOrders(currentOrders.filter((order) => order.id !== orderId))
    },
    [commitOrders, onError]
  )

  /**
   * Updates editable order fields while preserving its ID, ticket and creation date.
   * Any local edit marks the order as not yet synchronized.
   *
   * @param {string} orderId - Internal order ID.
   * @param {PendingOrderChanges} changes - Fields to update.
   * @returns {PendingOrder | null} Updated order, or null on validation/storage failure.
   */
  const updatePendingOrder = useCallback(
    (orderId: string, changes: PendingOrderChanges): PendingOrder | null => {
      if (!orderId?.trim() || !changes || typeof changes !== 'object') {
        onError?.('Los datos para actualizar la orden no son válidos.')
        return null
      }

      if (changes.products !== undefined && (!Array.isArray(changes.products) || changes.products.length === 0)) {
        onError?.('Una orden pendiente debe contener al menos un producto.')
        return null
      }

      if (changes.values !== undefined && (!changes.values || typeof changes.values !== 'object')) {
        onError?.('Los datos de la venta no son válidos.')
        return null
      }

      if (changes.reference !== undefined && typeof changes.reference !== 'string') {
        onError?.('La referencia de la orden debe ser texto.')
        return null
      }

      if (changes.discountPercent !== undefined && (!Number.isFinite(changes.discountPercent) || changes.discountPercent < 0)) {
        onError?.('El porcentaje de descuento no es válido.')
        return null
      }

      if (changes.discountAmount !== undefined && (!Number.isFinite(changes.discountAmount) || changes.discountAmount < 0)) {
        onError?.('El valor del descuento no es válido.')
        return null
      }

      if (changes.total !== undefined && (!Number.isFinite(changes.total) || changes.total < 0)) {
        onError?.('El total de la orden no es válido.')
        return null
      }

      if (changes.status !== undefined && !VALID_STATUSES.includes(changes.status)) {
        onError?.('El estado seleccionado no es válido.')
        return null
      }

      const existing = ordersRef.current.find((order) => order.id === orderId)
      if (!existing) {
        onError?.('La orden pendiente no existe.')
        return null
      }

      let updated: PendingOrder
      try {
        updated = {
          ...existing,
          ...cloneSnapshot(changes),
          id: existing.id,
          ticket: existing.ticket,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          syncStatus: 'LOCAL'
        }
      } catch {
        onError?.('No fue posible preparar los cambios de la orden.')
        return null
      }

      const nextOrders = ordersRef.current.map((order) =>
        order.id === orderId ? updated : order
      )

      return commitOrders(nextOrders) ? updated : null
    },
    [commitOrders, onError]
  )

  /**
   * Changes an order lifecycle status.
   *
   * @param {string} orderId - Internal order ID.
   * @param {PendingOrderStatus} status - Target lifecycle state.
   * @returns {PendingOrder | null} Updated order.
   */
  const updatePendingStatus = useCallback(
    (orderId: string, status: PendingOrderStatus): PendingOrder | null => {
      if (!VALID_STATUSES.includes(status)) {
        onError?.('El estado seleccionado no es válido.')
        return null
      }

      return updatePendingOrder(orderId, { status })
    },
    [onError, updatePendingOrder]
  )

  /**
   * Saves an existing local order through the configured backend adapter.
   * The adapter must persist by order ID (upsert) to make retries idempotent.
   *
   * @param {string} orderId - Internal order ID.
   * @returns {Promise<boolean>} Whether backend synchronization succeeded.
   */
  const persistPendingOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      if (!orderId?.trim()) {
        onError?.('La orden pendiente no tiene un identificador válido.')
        return false
      }

      if (typeof persistence?.save !== 'function') {
        onError?.('No se ha configurado la persistencia de órdenes en la base de datos.')
        return false
      }

      const existing = ordersRef.current.find((order) => order.id === orderId)
      if (!existing) {
        onError?.('La orden pendiente no existe.')
        return false
      }

      try {
        await persistence.save(cloneSnapshot(existing))
        const synchronized: PendingOrder = {
          ...existing,
          syncStatus: 'SYNCED',
          updatedAt: new Date().toISOString()
        }
        const nextOrders = ordersRef.current.map((order) =>
          order.id === orderId ? synchronized : order
        )

        if (!commitOrders(nextOrders)) return false
        return true
      } catch {
        const failed: PendingOrder = { ...existing, syncStatus: 'ERROR' }
        const nextOrders = ordersRef.current.map((order) =>
          order.id === orderId ? failed : order
        )
        commitOrders(nextOrders)
        onError?.('No fue posible guardar la orden en la base de datos. Puedes reintentar.')
        return false
      }
    },
    [commitOrders, onError, persistence]
  )

  /** Removes every locally stored order, including completed/cancelled history. */
  const clearPendingOrders = useCallback((): boolean => {
    return commitOrders([])
  }, [commitOrders])

  const activePendingOrders = useMemo(
    () => pendingOrders.filter((order) => ACTIVE_STATUSES.includes(order.status)),
    [pendingOrders]
  )

  const pendingOrdersCount = useMemo(
    () => pendingOrders.filter((order) => order.status === 'PENDING').length,
    [pendingOrders]
  )

  /** Searches active orders by ticket, reference or customer details. */
  const searchPendingOrders = useCallback(
    (query: string): PendingOrder[] => {
      const normalizedQuery = query.trim().toLocaleLowerCase()
      if (!normalizedQuery) return activePendingOrders

      return activePendingOrders.filter((order) =>
        [
          order.ticket,
          order.reference,
          order.customer?.name,
          order.customer?.document,
          order.customer?.phone
        ]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery))
      )
    },
    [activePendingOrders]
  )

  return {
    pendingOrders,
    activePendingOrders,
    pendingOrdersCount,
    isPendingOrdersReady: isHydrated,
    canPersistPendingOrders: typeof persistence?.save === 'function',
    savePendingOrder,
    resumePendingOrder,
    removePendingOrder,
    updatePendingOrder,
    updatePendingStatus,
    clearPendingOrders,
    persistPendingOrder,
    searchPendingOrders
  }
}

