import type { Product } from 'typesdefs'

/** Represents the operational lifecycle of a parked POS order. */
export type PendingOrderStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

/** Represents whether the local order has been synchronized with a backend. */
export type PendingOrderSyncStatus = 'LOCAL' | 'SYNCED' | 'ERROR'

/** Customer information captured with a parked sale. */
export interface PendingOrderCustomer {
  id: string | null
  name?: string
  document?: string
  phone?: string
  address?: string
}

/** Sale form values required to restore the current POS context. */
export interface PendingOrderValues {
  change: string
  cliId: string
  comment: string
  tableId: string
  valueDelivery: string
}

/** Immutable snapshot of the cart and metadata needed to resume a sale. */
export interface PendingOrder {
  id: string
  ticket: string
  status: PendingOrderStatus
  products: Product[]
  values: PendingOrderValues
  discountType?: string | null
  discountPercent: number
  discountAmount: number
  customer?: PendingOrderCustomer | null
  /** Optional cashier-facing label, e.g. "mesa 12" or "cliente vuelve". */
  reference?: string
  total: number
  createdAt: string
  updatedAt: string
  syncStatus: PendingOrderSyncStatus
}

/** Data needed to create an order snapshot. */
export interface CreatePendingOrderParams {
  products: Product[]
  values: PendingOrderValues
  total: number
  discountType?: string | null
  discountPercent?: number
  discountAmount?: number
  customer?: PendingOrderCustomer | null
  reference?: string
}

/** Editable fields for an existing pending order. */
export type PendingOrderChanges = Partial<
  Omit<PendingOrder, 'id' | 'ticket' | 'createdAt' | 'updatedAt' | 'syncStatus'>
>

/**
 * Adapter for persistence in an application backend.
 * The implementation should upsert by `order.id` to avoid duplicate records
 * when the cashier retries a failed synchronization.
 */
export interface PendingOrdersPersistence {
  save: (order: PendingOrder) => Promise<unknown>
}

/** Configuration for the pending orders hook. */
export interface UsePendingOrdersOptions {
  onError?: (message: string) => void
  persistence?: PendingOrdersPersistence
  storageKey?: string
}
