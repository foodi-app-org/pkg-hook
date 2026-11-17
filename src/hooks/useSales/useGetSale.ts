
import { useLazyQuery } from '@apollo/client'
import { useCallback } from 'react'

import { GET_ONE_SALE } from './queries'

export type SaleRefundCommercialStatus =
  | 'NOT_REFUNDED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_REFUNDED'
  | 'REVIEW_REQUIRED'

export interface SaleRefundStockExtra {
  catalogId: string
  name: string
  soldQuantity: number
  expectedRestockedQuantity: number
  restockedQuantity: number
  wasRestocked: boolean
  restockVerified: boolean
  currentStock: number | null
  manageStock: boolean | null
}

export interface SaleRefundAccountingLine {
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

  extras: SaleRefundStockExtra[]
}

export interface SaleRefundKardexAmount {
  key: string
  delta: number
}

export interface SaleRefundKardexAudit {
  refundId: string
  verified: boolean
  issues: string[]
  expected: SaleRefundKardexAmount[]
  actual: SaleRefundKardexAmount[]
}

export interface SaleRefundAccounting {
  saleId: string
  saleReference: string
  commercialStatus: SaleRefundCommercialStatus

  originalGrossMinor: string | null
  originalMerchandiseMinor: string
  confirmedRefundMinor: string
  pendingRefundMinor: string
  cancelledRefundMinor: string
  effectiveMerchandiseMinor: string

  confirmedRefundCount: number
  pendingRefundCount: number
  cancelledRefundCount: number

  verified: boolean
  issues: string[]

  kardexVerified: boolean
  stockIssues: string[]
  kardexAudits: SaleRefundKardexAudit[]

  lines: SaleRefundAccountingLine[]
}

export const useGetSale = () => {
  const [
    getOneSalesStore,
    {
      loading,
      data,
      called,
      error,
      refetch,
      networkStatus
    }
  ] = useLazyQuery(GET_ONE_SALE, {
    fetchPolicy: 'no-cache',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'none'
  })

  const handleGetSale = useCallback(
    async (pCodeRef: string) => {
      const reference = pCodeRef.trim()

      if (!reference) {
        throw new Error(
          'La referencia de la venta es obligatoria.'
        )
      }

      return getOneSalesStore({
        variables: {
          pCodeRef: reference
        },
        fetchPolicy: 'no-cache'
      })
    },
    [getOneSalesStore]
  )

  const response = data?.getOneSalesStore
  const sale = response?.data ?? null

  const refundSummary = (
    sale?.refundSummary ?? null
  ) as SaleRefundAccounting | null

  return {
    // Compatibilidad con el hook original.
    data: response,
    loading,
    error,
    called,
    getOneSalesStore,
    handleGetSale,

    // Nuevos accesos directos.
    sale,
    refundSummary,

    commercialStatus:
      refundSummary?.commercialStatus ?? 'NOT_REFUNDED',

    hasRefunds:
      Boolean(refundSummary) &&
      refundSummary.commercialStatus !== 'NOT_REFUNDED',

    isFullyRefunded:
      refundSummary?.commercialStatus === 'FULLY_REFUNDED',

    isPartiallyRefunded:
      refundSummary?.commercialStatus === 'PARTIALLY_REFUNDED',

    hasPendingRefund:
      refundSummary?.commercialStatus === 'REFUND_PENDING',

    refundVerified:
      refundSummary?.verified ?? null,

    kardexVerified:
      refundSummary?.kardexVerified ?? null,

    networkStatus,
    refetch
  }
}
