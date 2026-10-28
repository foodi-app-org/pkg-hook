import type { PendingOrder, PendingOrderStatus } from '../types/pending-orders.types'

export const DEFAULT_PENDING_ORDERS_STORAGE_KEY = 'pos_pending_orders'

const VALID_STATUSES: PendingOrderStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
]

const normalizePendingOrder = (value: unknown): PendingOrder | null => {
  if (!value || typeof value !== 'object') return null

  const order = value as Partial<PendingOrder> & { status?: string }
  if (
    typeof order.id !== 'string' ||
    typeof order.ticket !== 'string' ||
    !Array.isArray(order.products) ||
    order.products.length === 0 ||
    !order.values ||
    typeof order.values !== 'object'
  ) {
    return null
  }

  // Migrate the status name used by the first implementation.
  const storedStatus = (value as { status?: string }).status
  const migratedStatus = storedStatus === 'RESUMED' ? 'IN_PROGRESS' : storedStatus
  if (!migratedStatus || !VALID_STATUSES.includes(migratedStatus as PendingOrderStatus)) {
    return null
  }

  const now = new Date().toISOString()
  const createdAt = typeof order.createdAt === 'string' ? order.createdAt : now
  const values = order.values as Partial<PendingOrder['values']>
  const syncStatus = order.syncStatus === 'SYNCED' || order.syncStatus === 'ERROR'
    ? order.syncStatus
    : 'LOCAL'

  return {
    id: order.id,
    ticket: order.ticket,
    status: migratedStatus as PendingOrderStatus,
    products: order.products as PendingOrder['products'],
    values: {
      change: String(values.change ?? ''),
      cliId: String(values.cliId ?? ''),
      comment: String(values.comment ?? ''),
      tableId: String(values.tableId ?? ''),
      valueDelivery: String(values.valueDelivery ?? '')
    },
    discountType: order.discountType ?? null,
    discountPercent: Number.isFinite(order.discountPercent) ? Number(order.discountPercent) : 0,
    discountAmount: Number.isFinite(order.discountAmount) ? Number(order.discountAmount) : 0,
    customer: order.customer ?? null,
    reference: typeof order.reference === 'string' ? order.reference : '',
    total: Number.isFinite(order.total) ? Math.max(0, Number(order.total)) : 0,
    createdAt,
    updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : createdAt,
    syncStatus
  }
}

/**
 * Reads and validates the saved pending-order list.
 * Browser storage is accessed only when this function is called in a browser.
 *
 * @param {string} storageKey - Local storage key.
 * @returns {PendingOrder[]} Valid persisted orders.
 */
export const readPendingOrders = (
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
): PendingOrder[] => {
  if (typeof window === 'undefined') return []

  try {
    const serialized = window.localStorage.getItem(storageKey)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizePendingOrder).filter((order): order is PendingOrder => order !== null)
  } catch {
    return []
  }
}

/**
 * Writes the entire pending-order list to local storage.
 * Returns false instead of throwing so the POS can preserve the cart on failure.
 *
 * @param {PendingOrder[]} orders - Orders to persist.
 * @param {string} storageKey - Local storage key.
 * @returns {boolean} Whether persistence succeeded.
 */
export const writePendingOrders = (
  orders: PendingOrder[],
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
): boolean => {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(orders))
    return true
  } catch {
    return false
  }
}
