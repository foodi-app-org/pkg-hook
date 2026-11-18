'use client'

import { useQuery } from '@apollo/client'
import { GET_SALE_CANCELLATION_LEDGER } from './queries'
import type { SaleCancellationLedger, UseSaleCancellationLedgerOptions } from './types'

/** Only confirmed refunds REGISTERED as cancellations appear in this ledger. */
export function useSaleCancellationLedger(
  from: string,
  to: string,
  options: UseSaleCancellationLedgerOptions = {}
) {
  const isActive = (options.enabled ?? true) && Boolean(from.trim() && to.trim())
  const query = useQuery<
    { getSaleCancellationLedger: SaleCancellationLedger },
    { from: string; to: string }
  >(GET_SALE_CANCELLATION_LEDGER, {
    variables: { from: from.trim(), to: to.trim() },
    skip: !isActive,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'none',
    onError: (error: Error) => {
      try { options.sendNotification?.({
        title: 'Error consultando cancelaciones',
        description: error.message,
        backgroundColor: 'error'
      }) } catch { /* Notification failures never change financial results. */ }
    }
  })

  return {
    ledger: query.data?.getSaleCancellationLedger ?? null,
    loading: query.loading,
    error: query.error ?? null,
    refetch: query.refetch,
    /** Values in centésimas COP; only verified internal accounting is in confirmedVerifiedMinor. */
    summary: query.data?.getSaleCancellationLedger?.summary ?? null,
    rows: query.data?.getSaleCancellationLedger?.rows ?? []
  }
}
