import { Cookies } from '../../../cookies'
import { getCurrentDomain } from '../../../utils'

import type { PendingOrder, PendingOrderStatus } from '../types/pending-orders.types'

export const DEFAULT_PENDING_ORDERS_STORAGE_KEY = 'pos_pending_orders'

/**
 * Resuelve el dominio para las cookies de órdenes pendientes.
 * En localhost js-cookie necesita `domain: undefined` para funcionar, igual que
 * en el resto del paquete (useLogout, useSales).
 *
 * @returns {string | undefined} Dominio a usar, o undefined en localhost/SSR.
 */
const resolvePendingOrdersCookieDomain = (): string | undefined => {
  const domain = getCurrentDomain()
  if (typeof domain !== 'string' || domain === 'localhost') return undefined
  return domain
}

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
 *
 * Las órdenes pendientes se guardan en cookies (no en localStorage) para que
 * compartan ciclo de vida con la sesión: al cerrar sesión se eliminan junto con
 * las demás cookies de sesión. Solo se accede a cookies en el navegador.
 *
 * @param {string} storageKey - Cookie key.
 * @returns {PendingOrder[]} Valid persisted orders.
 */
export const readPendingOrders = (
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
): PendingOrder[] => {
  if (typeof window === 'undefined') return []

  try {
    const serialized = Cookies.get(storageKey)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed.map(normalizePendingOrder).filter((order): order is PendingOrder => order !== null)
  } catch {
    return []
  }
}

/**
 * Writes the entire pending-order list to a cookie.
 * Returns false instead of throwing so the POS can preserve the cart on failure.
 *
 * Nota: las cookies tienen un límite de ~4KB. Si la lista no cabe, el navegador
 * puede descartar el valor; por eso se vuelve a leer la cookie tras escribir
 * para confirmar que se persistió y, si no, se reporta el fallo.
 *
 * @param {PendingOrder[]} orders - Orders to persist.
 * @param {string} storageKey - Cookie key.
 * @returns {boolean} Whether persistence succeeded.
 */
export const writePendingOrders = (
  orders: PendingOrder[],
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const domain = resolvePendingOrdersCookieDomain()
    const serialized = JSON.stringify(orders)

    // Una lista vacía equivale a no tener órdenes pendientes: borramos la cookie
    // para no dejar basura ni ocupar espacio.
    if (!Array.isArray(orders) || orders.length === 0) {
      Cookies.remove(storageKey, { domain, path: '/' })
      return true
    }

    Cookies.set(storageKey, serialized, {
      domain,
      path: '/',
      // Igual que el resto de cookies del paquete: Secure solo en producción.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Confirmación: si la cookie no se pudo guardar (p. ej. excede ~4KB), la
    // lectura no coincidirá y reportamos fallo para que el POS conserve el
    // carrito en lugar de creer que se guardó.
    return Cookies.get(storageKey) === serialized
  } catch {
    return false
  }
}

/**
 * Removes the pending-orders cookie entirely.
 *
 * Se usa al cerrar sesión para que las órdenes en espera no sobrevivan a la
 * sesión del operador.
 *
 * @param {string} storageKey - Cookie key.
 * @returns {boolean} Whether the cookie was removed (or there was nothing to do).
 */
export const clearPendingOrdersStorage = (
  storageKey = DEFAULT_PENDING_ORDERS_STORAGE_KEY
): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const domain = resolvePendingOrdersCookieDomain()
    Cookies.remove(storageKey, { domain, path: '/' })
    // Borrado defensivo también sin domain, por si la cookie se creó en otro
    // contexto de dominio.
    Cookies.remove(storageKey, { path: '/' })
    return true
  } catch {
    return false
  }
}
