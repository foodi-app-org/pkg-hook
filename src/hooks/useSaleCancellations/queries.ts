import { gql } from '@apollo/client'
import { REFUND_FIELDS } from '../useSaleRefunds'

/** Reuses the canonical refund fragment exported by pkg-hook. */
export const SALE_CANCELLATION_FIELDS = gql`
  fragment SaleCancellationFields on SaleCancellationView {
    operationId operationPhase fiscalStatus
    saleId saleReference historicalState cancellationStatus commercialStatus
    canRequest paymentKind originalMerchandiseMinor originalCollectedMinor
    excludedChargesMinor confirmedRefundMinor pendingRefundMinor effectiveMerchandiseMinor
    verified kardexVerified cashVerified providerVerified issues
    latestCancellationRefund { ...RefundFields }
    lines {
      shoppingCartId soldProductId catalogProductId productName
      soldQuantity returnedQuantity reservedQuantity remainingQuantity
      expectedRestockedQuantity restockedQuantity wasRestocked restockVerified
      currentStock manageStock
      extras {
        catalogId name soldQuantity expectedRestockedQuantity restockedQuantity
        wasRestocked restockVerified currentStock manageStock
      }
    }
  }
  ${REFUND_FIELDS}
`

export const GET_SALE_CANCELLATION = gql`
  query GetSaleCancellation($saleReference: String!) {
    getSaleCancellation(saleReference: $saleReference) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const REQUEST_FULL_SALE_CANCELLATION = gql`
  mutation RequestFullSaleCancellation($input: RequestFullSaleCancellationInput!) {
    requestFullSaleCancellation(input: $input) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const CONFIRM_EXTERNAL_SALE_CANCELLATION = gql`
  mutation ConfirmExternalSaleCancellation($input: ConfirmExternalSaleCancellationInput!) {
    confirmExternalSaleCancellation(input: $input) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const WITHDRAW_PENDING_SALE_CANCELLATION = gql`
  mutation WithdrawPendingSaleCancellation($input: WithdrawPendingSaleCancellationInput!) {
    withdrawPendingSaleCancellation(input: $input) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const CANCEL_UNPAID_SALE_ORDER = gql`
  mutation CancelUnpaidSaleOrder($input: CancelUnpaidOrderInput!) {
    cancelUnpaidSaleOrder(input: $input) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const REQUEST_CANCELLATION_MANUAL_REVIEW = gql`
  mutation RequestCancellationManualReview($input: RequestCancellationManualReviewInput!) {
    requestCancellationManualReview(input: $input) { ...SaleCancellationFields }
  }
  ${SALE_CANCELLATION_FIELDS}
`
export const GET_SALE_CANCELLATION_LEDGER = gql`
  query GetSaleCancellationLedger($from: String!, $to: String!) {
    getSaleCancellationLedger(from: $from, to: $to) {
      from to timezone currency
      summary {
        confirmedVerifiedMinor excludedUnverifiedMinor confirmedCount unverifiedCount
      }
      rows {
        refundId saleId saleReference requestedAt confirmedAt amountMinor paymentKind
        paymentId accountingVerified providerVerified issues
      }
    }
  }
`
