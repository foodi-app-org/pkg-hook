import type { ApolloError } from '@apollo/client'
import type {
  SaleCancellationAction,
  SaleCancellationView
} from './types'

/** Notification colors follow the project's existing sendNotification contract. */
export type CancellationToast = {
  title: string
  description: string
  backgroundColor: 'success' | 'warning' | 'error' | 'info'
}

const KNOWN_CODES: Record<string, string> = {
  FORBIDDEN: 'No tienes permisos para realizar esta operación.',
  CANCELLATION_FORBIDDEN: 'No tienes permisos para operar sobre esta venta.',
  CANCELLATION_NOT_AVAILABLE: 'La venta no cumple las condiciones para una cancelación automática.',
  CANCELLATION_IDEMPOTENCY_CONFLICT: 'Esta clave de operación ya se utilizó para otra solicitud. Revisa el estado antes de intentar nuevamente.',
  CANCELLATION_REFUND_IDENTITY_CONFLICT: 'La devolución y la operación de cancelación no coinciden. Requiere conciliación.',
  CANCELLATION_LINES: 'Debes especificar todas las líneas pendientes de devolver.',
  CANCELLATION_LINES_DUPLICATED_OR_INVALID: 'Las líneas de inventario están duplicadas o contienen una disposición inválida.',
  CANCELLATION_ALREADY_PAID: 'No puedes retirar una devolución que ya se pagó.',
  CANCELLATION_CASH_SESSION_INVALID: 'La sesión de caja no corresponde a este medio de pago.',
  REFUND_CASH_SESSION_REQUIRED: 'Selecciona una sesión de caja activa.',
  REFUND_CASH_INSUFFICIENT: 'La caja no tiene saldo suficiente para este reembolso.',
  REFUND_CASH_OPERATOR: 'La devolución debe realizarla el responsable de la caja.',
  REFUND_CASH_NOT_REPRESENTABLE: 'El importe no es representable según la configuración de efectivo.',
  REFUND_PAYMENT_UNSUPPORTED: 'La venta no tiene un único pago original verificable.',
  CANCELLATION_REFUND_LINK_PENDING: 'La operación está pendiente de vinculación. Consulta la conciliación antes de repetir.'
}

/** GraphQL errors may contain an application code in extensions.code. */
export function cancellationErrorDescription(error: unknown): string {
  const e = error as Partial<ApolloError> | undefined
  const graphql = e?.graphQLErrors?.[0]
  const code = graphql?.extensions?.code
  if (typeof code === 'string' && code in KNOWN_CODES) return KNOWN_CODES[code]
  if (error instanceof Error && error.message.trim()) return error.message
  return 'No fue posible completar la operación. Consulta su estado antes de intentar nuevamente.'
}

/** Never advertise bank confirmation based only on an operator's attestation. */
export function notificationForCancellation(view: SaleCancellationView, action: SaleCancellationAction): CancellationToast {
  if (action === 'requestManualReview') return {
    title: 'Conciliación solicitada',
    description: 'El caso quedó registrado para revisión. No se movió dinero ni inventario.',
    backgroundColor: 'info'
  }
  if (action === 'cancelUnpaid') return view.cancellationStatus === 'ORDER_REJECTED' ? {
    title: 'Pedido rechazado',
    description: 'El pedido sin cobro fue rechazado. No se registró devolución de dinero.',
    backgroundColor: 'success'
  } : {
    title: 'Revisar pedido', description: 'La operación no pudo verificarse como rechazada.', backgroundColor: 'warning'
  }
  if (action === 'withdrawPending') return view.operationPhase === 'WITHDRAWN' ? {
    title: 'Solicitud retirada',
    description: 'Se retiró la devolución pendiente. Una devolución ya pagada no puede retirarse.',
    backgroundColor: 'success'
  } : {
    title: 'Revisar solicitud', description: 'Consulta el estado actual de la devolución.', backgroundColor: 'warning'
  }
  if (view.operationPhase === 'PENDING_EXTERNAL' || view.cancellationStatus === 'PENDING_EXTERNAL') return {
    title: 'Cancelación pendiente',
    description: 'La devolución externa está solicitada, pero aún no se ha confirmado. No hay salida de efectivo.',
    backgroundColor: 'warning'
  }
  if (view.operationPhase === 'OPERATOR_CONFIRMED') return {
    title: 'Confirmación registrada',
    description: 'Existe constancia del operador, pero no es verificación bancaria. La conciliación externa sigue pendiente.',
    backgroundColor: 'warning'
  }
  if (view.operationPhase === 'RECORDED_CASH' && view.cashVerified && view.verified) return {
    title: 'Cancelación en efectivo registrada',
    description: 'La devolución quedó registrada y conciliada internamente en la caja. Revisa el movimiento y kardex.',
    backgroundColor: 'success'
  }
  if (view.operationPhase === 'NEEDS_REVIEW' || view.operationPhase === 'RECOVERY_REQUIRED' || !view.verified) return {
    title: 'Operación registrada para revisión',
    description: 'El servidor devolvió una operación, pero su conciliación aún necesita verificarse. No repitas el pago.',
    backgroundColor: 'warning'
  }
  return {
    title: 'Estado de cancelación actualizado',
    description: 'Consulta los movimientos y el saldo neto antes de considerarla finalizada.',
    backgroundColor: 'info'
  }
}

/** Amount strings stay exact: avoid floats for real money. */
export function formatCancellationMinorCOP(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || !/^-?(0|[1-9]\d*)$/.test(raw)) return '—'
  const minor = BigInt(raw)
  const sign = minor < 0n ? '−' : ''
  const value = minor < 0n ? -minor : minor
  const whole = (value / 100n).toLocaleString('es-CO')
  const decimals = (value % 100n).toString().padStart(2, '0')
  return `${sign}$ ${whole},${decimals}`
}
