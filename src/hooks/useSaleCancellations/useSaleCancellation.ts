'use client'

import { useQuery } from '@apollo/client'
import { useCallback } from 'react'

import { GET_SALE_CANCELLATION } from './queries'
import { useSaleCancellationActions } from './useSaleCancellationActions'
import type { SaleCancellationView, UseSaleCancellationOptions } from './types'

/**
 * Read-only cancellation state + all five actions. Historical order status is
 * not overwritten; cancellationStatus is an independent financial projection.
 *
 * Usage: useSaleCancellation(orderCode, { sendNotification })
 */
export function useSaleCancellation(saleReference: string, options: UseSaleCancellationOptions = {}) {
  const reference = saleReference.trim()
  const isActive = (options.enabled ?? true) && reference.length > 0
  const query = useQuery<
    { getSaleCancellation: SaleCancellationView },
    { saleReference: string }
  >(GET_SALE_CANCELLATION, {
    variables: { saleReference: reference },
    skip: !isActive,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'none',
    onError: (error: Error) => {
      try { options.sendNotification?.({
        title: 'No se pudo consultar la cancelación',
        description: error.message,
        backgroundColor: 'error'
      }) } catch { /* A toast failure must not break the read. */ }
    }
  })
  const actions = useSaleCancellationActions(options)
  const refresh = useCallback(async (): Promise<SaleCancellationView | null> => {
    if (!isActive) return null
    const result = await query.refetch({ saleReference: reference })
    return result.data?.getSaleCancellation ?? null
  }, [isActive, query.refetch, reference])
  const cancellation = query.data?.getSaleCancellation ?? null

  return {
    ...actions,
    cancellation,
    loading: query.loading,
    error: query.error ?? actions.mutationError,
    refetch: query.refetch,
    refresh,
    canRequest: isActive && Boolean(cancellation?.canRequest) && !actions.busy,
    needsReview: cancellation?.cancellationStatus === 'RECONCILIATION_REQUIRED' ||
      cancellation?.operationPhase === 'NEEDS_REVIEW' ||
      cancellation?.operationPhase === 'RECOVERY_REQUIRED',
    isExternalPending: cancellation?.cancellationStatus === 'PENDING_EXTERNAL',
    isFinanciallyCancelled: cancellation?.cancellationStatus === 'FINANCIALLY_CANCELLED',
    isUnpaidRejected: cancellation?.cancellationStatus === 'ORDER_REJECTED',
    /** This reflects operator-side evidence only; it is NOT bank certification. */
    isProviderVerified: cancellation?.providerVerified === true,
    isCashRefundVerified: cancellation?.paymentKind === 'CASH' &&
      cancellation.operationPhase === 'RECORDED_CASH' &&
      cancellation.verified && cancellation.cashVerified
  }
}
