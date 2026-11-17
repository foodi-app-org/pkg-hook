import type { PaymentChoice } from './checkout-readiness'
import type { FinancialMethod } from '../../useCashManagement/types'
import type { SessionPaymentPolicy } from '../../useCashManagement/useCashSessionPaymentPolicy'

export interface SessionMethodsInput {
  cashManagementEnabled: boolean
  cashEnabled: boolean
  cashKnown: boolean
  sessionId: string | null
  sessionStatus: string | null
  paymentMethods: readonly PaymentChoice[]
  financialMethods: readonly FinancialMethod[]
  policy: SessionPaymentPolicy | null
  loading: boolean
  error: boolean
  selectedId: string
}

export interface SessionMethodsResult {
  methods: PaymentChoice[]
  issue: string
  selectedDisallowed: boolean
  configured: boolean
  legacy: boolean
  ready: boolean
}

/**
 * Presentation policy. Backend MUST enforce the same rule inside the payment transaction.
 * Never show a fallback catalog if the configured policy is loading/unavailable.
 * An explicit `configured:false` server response preserves legacy session display.
 * @param input
 */
export function resolveSessionPaymentMethods(input: SessionMethodsInput): SessionMethodsResult {
  const plain = [...input.paymentMethods]
  const empty = (issue = ''): SessionMethodsResult => ({
    methods: [], issue, selectedDisallowed: false,
    configured: false, legacy: false, ready: false
  })

  if (!input.cashManagementEnabled || !input.cashEnabled) {
    return { methods: plain, issue: '', selectedDisallowed: false, configured: false, legacy: false, ready: true }
  }
  if (!input.cashKnown) return empty('Consultando la sesión de caja…')
  if (!input.sessionId || input.sessionStatus !== 'OPEN') return empty()
  if (input.loading) return empty('Consultando los medios de pago habilitados para este turno…')
  if (input.error) return empty('No se pudo consultar la configuración de pagos. Actualiza la caja antes de cobrar.')
  if (!input.policy || input.policy.sessionId !== input.sessionId) {
    return empty('No se pudo verificar qué medios de pago acepta esta caja.')
  }

  if (!input.policy.configured) {
    // Backward-compatible UI for genuinely legacy sessions only. Backend decides eligibility.
    return { methods: plain, issue: '', selectedDisallowed: false, configured: false, legacy: true, ready: true }
  }

  const ids = input.policy.methodIds
  if (!Array.isArray(ids) || ids.length === 0 || new Set(ids).size !== ids.length) {
    return empty('La configuración de medios de pago de esta sesión es inválida. Revisa la caja.')
  }
  const permitted = new Set(ids)
  const eligibleCatalog = new Set(
    input.financialMethods
      .filter(m => m.state === 'active' && m.financialKind !== 'UNKNOWN')
      .map(m => m.payId)
  )
  const methods = plain.filter(m => permitted.has(m.id) && eligibleCatalog.has(m.id))
  const selectedDisallowed = Boolean(input.selectedId && !methods.some(m => m.id === input.selectedId))
  return {
    methods,
    issue: methods.length === 0
      ? 'No hay medios de pago habilitados y vigentes en esta caja. Revisa Finanzas.'
      : selectedDisallowed
        ? 'El medio seleccionado no está habilitado para este turno. Selecciona uno de los disponibles.'
        : '',
    selectedDisallowed,
    configured: true,
    legacy: false,
    ready: methods.length > 0
  }
}
