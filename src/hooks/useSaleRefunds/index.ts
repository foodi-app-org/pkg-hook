'use client'
import { gql, useMutation, useQuery } from '@apollo/client'

export type RefundScope = 'FULL_REMAINING' | 'SELECTED'
export type RefundDisposition = 'RESTOCK' | 'DAMAGED' | 'NO_STOCK'
export type RefundStatus = 'PENDING_EXTERNAL' | 'COMPLETED' | 'CANCELLED'
export interface RefundLineInput { shoppingCartId: string; quantity: number; disposition: RefundDisposition }
export interface RequestRefundInput {
  saleReference: string
  scope: RefundScope
  defaultDisposition?: RefundDisposition | null
  items?: RefundLineInput[] | null
  cashSessionId?: string | null
  reason: string
  idempotencyKey: string
}
export interface ConfirmExternalRefundInput { refundId: string; externalReference: string; externallyVerified: true; idempotencyKey: string }
export interface CancelRefundInput { refundId: string; reason: string; idempotencyKey: string }
export interface RefundPreviewLine {
  shoppingCartId: string; productName: string; soldQuantity: number
  alreadyReservedQuantity: number; remainingQuantity: number; allocatedMinor: string
}
export interface RefundPreview {
  saleReference: string; saleId: string; paymentKind: string
  merchandiseNetMinor: string; refundableMerchandiseMinor: string; lines: RefundPreviewLine[]
}
export interface SaleRefundView {
  id: string; saleId: string; saleReference: string; originalPaymentId: string
  cashSessionId: string | null; status: RefundStatus; scope: RefundScope
  amountMinor: string; reason: string; requestedBy: string; requestedAt: string
  confirmedBy: string | null; confirmedAt: string | null; paymentId: string | null
  externalReference: string | null; cancelReason: string | null; cancelledBy: string | null
  cancelledAt: string | null
  items: { id: string; shoppingCartId: string; quantity: number; amountMinor: string; disposition: RefundDisposition }[]
}

export const REFUND_FIELDS = gql`
  fragment RefundFields on SaleRefundView {
    id saleId saleReference originalPaymentId cashSessionId status scope amountMinor reason
    requestedBy requestedAt confirmedBy confirmedAt paymentId externalReference
    cancelReason cancelledBy cancelledAt
    items { id shoppingCartId quantity amountMinor disposition }
  }
`
export const GET_REFUND_PREVIEW = gql`
  query GetSaleRefundPreview($saleReference: String!) {
    getSaleRefundPreview(saleReference: $saleReference) {
      saleReference saleId paymentKind merchandiseNetMinor refundableMerchandiseMinor
      lines { shoppingCartId productName soldQuantity alreadyReservedQuantity remainingQuantity allocatedMinor }
    }
  }
`
export const GET_SALE_REFUNDS = gql`
  query GetSaleRefunds($saleReference: String!) {
    getSaleRefunds(saleReference: $saleReference) { ...RefundFields }
  }
  ${REFUND_FIELDS}
`
export const REQUEST_SALE_REFUND = gql`
  mutation RequestSaleRefund($input: RequestSaleRefundInput!) {
    requestSaleRefund(input: $input) { ...RefundFields }
  }
  ${REFUND_FIELDS}
`
export const CONFIRM_EXTERNAL_SALE_REFUND = gql`
  mutation ConfirmExternalSaleRefund($input: ConfirmExternalSaleRefundInput!) {
    confirmExternalSaleRefund(input: $input) { ...RefundFields }
  }
  ${REFUND_FIELDS}
`
export const CANCEL_SALE_REFUND = gql`
  mutation CancelSaleRefund($input: CancelSaleRefundInput!) {
    cancelSaleRefund(input: $input) { ...RefundFields }
  }
  ${REFUND_FIELDS}
`

/** No optimistic financial mutation: UI waits for backend confirmation. */
export function useSaleRefunds(saleReference: string, enabled = true) {
  const sale = saleReference.trim()
  const isActive = enabled && sale.length > 0
  const preview = useQuery<{getSaleRefundPreview: RefundPreview}>(GET_REFUND_PREVIEW, {
    variables: { saleReference: sale }, skip: !isActive, fetchPolicy: 'network-only', errorPolicy: 'none'
  })
  const history = useQuery<{getSaleRefunds: SaleRefundView[]}>(GET_SALE_REFUNDS, {
    variables: { saleReference: sale }, skip: !isActive, fetchPolicy: 'network-only', errorPolicy: 'none'
  })
  const [request, requestState] = useMutation<{requestSaleRefund:SaleRefundView}, {input:RequestRefundInput}>(REQUEST_SALE_REFUND)
  const [confirm, confirmState] = useMutation<{confirmExternalSaleRefund:SaleRefundView},{input:ConfirmExternalRefundInput}>(CONFIRM_EXTERNAL_SALE_REFUND)
  const [cancel, cancelState] = useMutation<{cancelSaleRefund:SaleRefundView},{input:CancelRefundInput}>(CANCEL_SALE_REFUND)
  const refresh = async () => {
    if (!isActive) return
    await Promise.all([preview.refetch(),history.refetch()])
  }
  return {
    preview: preview.data?.getSaleRefundPreview ?? null,
    refunds: history.data?.getSaleRefunds ?? [],
    loading: preview.loading || history.loading,
    busy: requestState.loading || confirmState.loading || cancelState.loading,
    error: preview.error ?? history.error,
    refresh,
    request: async (input: RequestRefundInput) => {
      const response = await request({ variables: { input } })
      if (!response.data?.requestSaleRefund) throw new Error('Resultado de devolución no verificable')
      // Post-commit refetch failure must never be reported as a failed financial mutation.
      void refresh().catch(error => console.warn('[refunds] refresh failed after successful request', error))
      return response.data.requestSaleRefund
    },
    confirmExternal: async (input: ConfirmExternalRefundInput) => {
      const response = await confirm({ variables: { input } })
      if (!response.data?.confirmExternalSaleRefund) throw new Error('Confirmación no verificable')
      void refresh().catch(error => console.warn('[refunds] refresh failed after successful confirmation', error))
      return response.data.confirmExternalSaleRefund
    },
    cancel: async (input: CancelRefundInput) => {
      const response = await cancel({ variables: { input } })
      if (!response.data?.cancelSaleRefund) throw new Error('Cancelación no verificable')
      void refresh().catch(error => console.warn('[refunds] refresh failed after successful cancellation', error))
      return response.data.cancelSaleRefund
    }
  }
}

export interface RefundAccountingLine {
  shoppingCartId:string; soldProductId:string; catalogProductId:string; productName:string
  soldQuantity:number; returnedQuantity:number; reservedQuantity:number; remainingQuantity:number
}
export interface RefundAccounting {
  saleId:string; saleReference:string; originalGrossMinor:string|null
  originalMerchandiseMinor:string; confirmedRefundMinor:string; pendingRefundMinor:string
  cancelledRefundMinor:string; effectiveMerchandiseMinor:string
  confirmedRefundCount:number; pendingRefundCount:number; cancelledRefundCount:number
  verified:boolean; issues:string[]; stockIssues:string[]; kardexVerified:boolean;
  kardexAudits:{refundId:string;verified:boolean;issues:string[]}[]; lines:RefundAccountingLine[]
}
export const GET_SALE_REFUND_ACCOUNTING = gql`
  query GetSaleRefundAccounting($saleReference: String!) {
    getSaleRefundAccounting(saleReference:$saleReference) {
      saleId saleReference originalGrossMinor originalMerchandiseMinor confirmedRefundMinor
      pendingRefundMinor cancelledRefundMinor effectiveMerchandiseMinor
      confirmedRefundCount pendingRefundCount cancelledRefundCount verified issues stockIssues kardexVerified
      kardexAudits { refundId verified issues }
      lines { shoppingCartId soldProductId catalogProductId productName soldQuantity returnedQuantity reservedQuantity remainingQuantity }
    }
  }
`
export function useSaleRefundAccounting(saleReference:string, enabled=true) {
  return useQuery<{getSaleRefundAccounting: RefundAccounting}>(GET_SALE_REFUND_ACCOUNTING,{
    variables:{saleReference:saleReference.trim()},skip:!enabled||!saleReference.trim(),
    fetchPolicy:'network-only',errorPolicy:'none'
  })
}

export interface RefundSettlementRow {
  refundId:string; saleId:string; saleReference:string; requestedAt:string; confirmedAt:string
  amountMinor:string; paymentKind:string; paymentId:string|null
  accountingVerified:boolean; providerVerified:boolean; issues:string[]
}
export interface RefundSettlementLedger {
  from:string; to:string; timezone:string; currency:string
  summary:{confirmedVerifiedMinor:string;excludedUnverifiedMinor:string;confirmedCount:number;unverifiedCount:number}
  rows:RefundSettlementRow[]
}
export const GET_REFUND_SETTLEMENT_LEDGER = gql`
  query GetRefundSettlementLedger($from:String!,$to:String!) {
    getRefundSettlementLedger(from:$from,to:$to){
      from to timezone currency
      summary { confirmedVerifiedMinor excludedUnverifiedMinor confirmedCount unverifiedCount }
      rows { refundId saleId saleReference requestedAt confirmedAt amountMinor paymentKind paymentId accountingVerified providerVerified issues }
    }
  }
`
export function useRefundSettlementLedger(from:string,to:string,enabled=true){
  return useQuery<{getRefundSettlementLedger:RefundSettlementLedger}>(GET_REFUND_SETTLEMENT_LEDGER,{
    variables:{from,to},skip:!enabled||!from||!to,fetchPolicy:'network-only',errorPolicy:'none'
  })
}
export const GET_SALE_REFUND_KARDEX_AUDIT = gql`
  query GetSaleRefundKardexAudit($refundId: ID!) {
    getSaleRefundKardexAudit(refundId:$refundId) {
      refundId verified issues expected { key delta } actual { key delta }
    }
  }
`
export function useSaleRefundKardexAudit(refundId:string,enabled=true){
  return useQuery<{getSaleRefundKardexAudit:{refundId:string;verified:boolean;issues:string[];
    expected:{key:string;delta:number}[];actual:{key:string;delta:number}[]}}>(GET_SALE_REFUND_KARDEX_AUDIT,{
      variables:{refundId},skip:!enabled||!refundId,fetchPolicy:'network-only'
    })
}
