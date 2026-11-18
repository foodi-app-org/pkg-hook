'use client'

import { useApolloClient, useMutation } from '@apollo/client'
import { useCallback, useRef, useState } from 'react'

import { cancellationErrorDescription, notificationForCancellation } from './notification.helpers'
import {
  CANCEL_UNPAID_SALE_ORDER,
  CONFIRM_EXTERNAL_SALE_CANCELLATION,
  REQUEST_CANCELLATION_MANUAL_REVIEW,
  REQUEST_FULL_SALE_CANCELLATION,
  WITHDRAW_PENDING_SALE_CANCELLATION
} from './queries'

import type {
  CancelUnpaidOrderInput,
  ConfirmExternalSaleCancellationInput,
  RequestCancellationManualReviewInput,
  RequestFullSaleCancellationInput,
  SaleCancellationAction,
  SaleCancellationView,
  UseSaleCancellationOptions,
  WithdrawPendingSaleCancellationInput
} from './types'

/** Names of ACTIVE GraphQL operations to refresh, not a mutation-side ledger calculator. */
const DEFAULT_REFETCH_QUERIES = [
  'GetSaleCancellation',
  'GetSaleCancellationLedger',
  'GetSaleRefundPreview',
  'GetSaleRefunds',
  'GetSaleRefundAccounting',
  'GetSaleRefundKardexAudit',
  'GetRefundSettlementLedger',
  'SalePaymentEvidence',
  'CashSession',
  'CashMovements',
  'CashReconciliation',
  'CashSessions',
  'CurrentCashSession',
  'CashUnlinkedSales',
  'getOneSalesStore'
]

const noNotification = () => undefined
const financialResultError = () => new Error(
  'No se pudo verificar el resultado en el servidor. Consulta el estado de la venta y reutiliza la misma clave de idempotencia; no generes otro pago.'
)

export interface SaleCancellationActionsOptions extends Pick<
  UseSaleCancellationOptions, 'sendNotification' | 'extraRefetchQueries' | 'onResolved'
> {}

/**
 * Mutations for the backend v2, without optimistic writes.
 * Every request must carry a stable caller-owned idempotencyKey. A transport
 * failure does not prove rollback: retry only with the SAME key and payload.
 * @param options
 */
export function useSaleCancellationActions(options: SaleCancellationActionsOptions = {}) {
  const { sendNotification = noNotification, extraRefetchQueries = [], onResolved } = options
  const client = useApolloClient()
  const operationInFlight = useRef(false)
  const [pendingAction, setPendingAction] = useState<SaleCancellationAction | null>(null)

  const [requestMutation, requestState] = useMutation<
    { requestFullSaleCancellation: SaleCancellationView },
    { input: RequestFullSaleCancellationInput }
  >(REQUEST_FULL_SALE_CANCELLATION, { fetchPolicy: 'no-cache', errorPolicy: 'none' })

  const [confirmMutation, confirmState] = useMutation<
    { confirmExternalSaleCancellation: SaleCancellationView },
    { input: ConfirmExternalSaleCancellationInput }
  >(CONFIRM_EXTERNAL_SALE_CANCELLATION, { fetchPolicy: 'no-cache', errorPolicy: 'none' })

  const [withdrawMutation, withdrawState] = useMutation<
    { withdrawPendingSaleCancellation: SaleCancellationView },
    { input: WithdrawPendingSaleCancellationInput }
  >(WITHDRAW_PENDING_SALE_CANCELLATION, { fetchPolicy: 'no-cache', errorPolicy: 'none' })

  const [cancelUnpaidMutation, unpaidState] = useMutation<
    { cancelUnpaidSaleOrder: SaleCancellationView },
    { input: CancelUnpaidOrderInput }
  >(CANCEL_UNPAID_SALE_ORDER, { fetchPolicy: 'no-cache', errorPolicy: 'none' })

  const [manualMutation, manualState] = useMutation<
    { requestCancellationManualReview: SaleCancellationView },
    { input: RequestCancellationManualReviewInput }
  >(REQUEST_CANCELLATION_MANUAL_REVIEW, { fetchPolicy: 'no-cache', errorPolicy: 'none' })

  const notify = useCallback((message: {
    title: string
    description: string
    backgroundColor: 'success' | 'warning' | 'error' | 'info'
  }) => {
    try { sendNotification(message) }
    catch (e) { console.warn('[sale-cancellations] notification callback failed', e) }
  }, [sendNotification])

  const invalidateActiveQueries = useCallback((): void => {
    const queryNames = [...new Set([...DEFAULT_REFETCH_QUERIES, ...extraRefetchQueries])]
    // Refetching after a COMMITTED mutation is only a UI read. Errors must NOT
    // make the client claim the payout was rolled back.
    void client.refetchQueries({ include: queryNames }).catch(error => {
      console.warn('[sale-cancellations] UI refresh failed; verify backend state', error)
    })
  }, [client, extraRefetchQueries])

  const execute = useCallback(async (
    action: SaleCancellationAction,
    send: () => Promise<SaleCancellationView | null | undefined>,
    expectedReference?: string
  ): Promise<SaleCancellationView> => {
    if (operationInFlight.current) {
      throw new Error('Ya hay una operación de cancelación en proceso.')
    }
    operationInFlight.current = true
    setPendingAction(action)
    try {
      const view = await send()
      if (!view?.saleId || !view.saleReference ||
        (expectedReference && view.saleReference !== expectedReference)) {
        throw financialResultError()
      }

      // Notify according to ACTUAL backend result, never assume every resolved
      // mutation means money returned or a bank settlement confirmed.
      notify(notificationForCancellation(view, action))
      invalidateActiveQueries()
      try { onResolved?.(view, action) }
      catch (error) { console.warn('[sale-cancellations] onResolved failed', error) }
      return view
    } catch (error) {
      invalidateActiveQueries()
      notify({
        title: 'No se pudo verificar la cancelación',
        description: `${cancellationErrorDescription(error)} Verifica el historial antes de volver a operar; si hubo un fallo de red, conserva la misma clave de idempotencia.`,
        backgroundColor: 'error'
      })
      throw error
    } finally {
      operationInFlight.current = false
      setPendingAction(null)
    }
  }, [invalidateActiveQueries, notify, onResolved])

  const requestFull = useCallback(async (input: RequestFullSaleCancellationInput) =>
    execute('requestFull', async () => {
      const r = await requestMutation({ variables: { input } })
      return r.data?.requestFullSaleCancellation
    }, input.saleReference), [execute, requestMutation])

  const confirmExternal = useCallback(async (input: ConfirmExternalSaleCancellationInput) =>
    execute('confirmExternal', async () => {
      const r = await confirmMutation({ variables: { input } })
      return r.data?.confirmExternalSaleCancellation
    }), [execute, confirmMutation])

  const withdrawPending = useCallback(async (input: WithdrawPendingSaleCancellationInput) =>
    execute('withdrawPending', async () => {
      const r = await withdrawMutation({ variables: { input } })
      return r.data?.withdrawPendingSaleCancellation
    }), [execute, withdrawMutation])

  const cancelUnpaid = useCallback(async (input: CancelUnpaidOrderInput) =>
    execute('cancelUnpaid', async () => {
      const r = await cancelUnpaidMutation({ variables: { input } })
      return r.data?.cancelUnpaidSaleOrder
    }, input.saleReference), [execute, cancelUnpaidMutation])

  const requestManualReview = useCallback(async (input: RequestCancellationManualReviewInput) =>
    execute('requestManualReview', async () => {
      const r = await manualMutation({ variables: { input } })
      return r.data?.requestCancellationManualReview
    }, input.saleReference), [execute, manualMutation])

  return {
    requestFull,
    confirmExternal,
    withdrawPending,
    cancelUnpaid,
    requestManualReview,
    busy: pendingAction !== null || requestState.loading || confirmState.loading ||
      withdrawState.loading || unpaidState.loading || manualState.loading,
    pendingAction,
    mutationError: requestState.error ?? confirmState.error ?? withdrawState.error ??
      unpaidState.error ?? manualState.error ?? null
  }
}
