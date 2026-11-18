import type { SendNotificationFn } from 'typesdefs'
import type { SaleRefundView, RefundSettlementLedger } from '../useSaleRefunds'

/** All monetary fields in centésimas COP, represented as decimal strings. */
export type CancellationMinor = string
export type CancellationDisposition = 'RESTOCK' | 'DAMAGED' | 'NO_STOCK'
export type SaleCancellationStatus =
  | 'NOT_CONCLUDED'
  | 'RECONCILIATION_REQUIRED'
  | 'UNSUPPORTED_PAYMENT'
  | 'CHARGES_REQUIRE_MANUAL_RECONCILIATION'
  | 'PENDING_OTHER_REFUND'
  | 'ELIGIBLE'
  | 'PENDING_EXTERNAL'
  | 'FINANCIALLY_CANCELLED'
  | 'ALREADY_REFUNDED'
  | 'PENDING_WITHDRAWN'
  | 'ORDER_REJECTED'

export type CancellationOperationPhase =
  | 'PREPARED'
  | 'PENDING_EXTERNAL'
  | 'RECORDED_CASH'
  | 'OPERATOR_CONFIRMED'
  | 'ORDER_REJECTED'
  | 'NEEDS_REVIEW'
  | 'WITHDRAWN'
  | 'RECOVERY_REQUIRED'

export interface SaleCancellationLine {
  shoppingCartId: string
  soldProductId: string
  catalogProductId: string
  productName: string
  soldQuantity: number
  returnedQuantity: number
  reservedQuantity: number
  remainingQuantity: number
  expectedRestockedQuantity: number
  restockedQuantity: number
  wasRestocked: boolean
  restockVerified: boolean
  currentStock: number | null
  manageStock: boolean | null
  extras: Array<{
    catalogId: string
    name: string
    soldQuantity: number
    expectedRestockedQuantity: number
    restockedQuantity: number
    wasRestocked: boolean
    restockVerified: boolean
    currentStock: number | null
    manageStock: boolean | null
  }>
}
export interface SaleCancellationView {
  operationId: string | null
  operationPhase: CancellationOperationPhase | null
  fiscalStatus: string | null
  saleId: string
  saleReference: string
  historicalState: number
  cancellationStatus: SaleCancellationStatus
  commercialStatus: string
  canRequest: boolean
  paymentKind: string | null
  originalMerchandiseMinor: CancellationMinor | null
  originalCollectedMinor: CancellationMinor | null
  excludedChargesMinor: CancellationMinor | null
  confirmedRefundMinor: CancellationMinor | null
  pendingRefundMinor: CancellationMinor | null
  effectiveMerchandiseMinor: CancellationMinor | null
  verified: boolean
  kardexVerified: boolean
  cashVerified: boolean
  /** false does NOT mean the bank reversed payment; provider verification is not implemented. */
  providerVerified: boolean | null
  issues: string[]
  latestCancellationRefund: SaleRefundView | null
  lines: SaleCancellationLine[]
}

export interface SaleCancellationLineDispositionInput {
  shoppingCartId: string
  disposition: CancellationDisposition
}
export interface RequestFullSaleCancellationInput {
  saleReference: string
  reason: string
  idempotencyKey: string
  disposition: CancellationDisposition
  lineDispositions?: SaleCancellationLineDispositionInput[] | null
  cashSessionId?: string | null
}
export interface ConfirmExternalSaleCancellationInput {
  refundId: string
  externalReference: string
  /** Explicit operator attestation, NOT provider verification. */
  externallyVerified: true
  idempotencyKey: string
}
export interface WithdrawPendingSaleCancellationInput {
  refundId: string
  reason: string
  idempotencyKey: string
}
export interface CancelUnpaidOrderInput {
  saleReference: string
  reason: string
  idempotencyKey: string
}
export interface RequestCancellationManualReviewInput extends CancelUnpaidOrderInput {
  details: string
}
export type SaleCancellationAction =
  | 'requestFull'
  | 'confirmExternal'
  | 'withdrawPending'
  | 'cancelUnpaid'
  | 'requestManualReview'
export type CancellationNotification = SendNotificationFn
export type SaleCancellationLedger = RefundSettlementLedger

export interface UseSaleCancellationOptions {
  enabled?: boolean
  sendNotification?: CancellationNotification
  /** Names of additional ACTIVE Apollo operations to refresh, if needed. */
  extraRefetchQueries?: string[]
  /** Called after an actual GraphQL result is received; callback failure is non-financial. */
  onResolved?: (view: SaleCancellationView, action: SaleCancellationAction) => void
}

export interface UseSaleCancellationLedgerOptions {
  enabled?: boolean
  sendNotification?: CancellationNotification
}

/** Small field projection optionally selected by useGetSale's legacy query. */
export interface SaleCancellationOrderProjection {
  operationId: string | null
  operationPhase: CancellationOperationPhase | null
  fiscalStatus: string | null
  cancellationStatus: SaleCancellationStatus
  commercialStatus: string
  canRequest: boolean
  paymentKind: string | null
  confirmedRefundMinor: string | null
  pendingRefundMinor: string | null
  effectiveMerchandiseMinor: string | null
  verified: boolean
  kardexVerified: boolean
  cashVerified: boolean
  providerVerified: boolean | null
  issues: string[]
  latestCancellationRefund: { id: string; status: string; amountMinor: string; paymentId: string | null } | null
}
