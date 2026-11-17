export type FinanceKind = 'CASH'|'CARD'|'BANK_TRANSFER'|'DIGITAL_WALLET'|'OTHER'|'UNKNOWN'
export interface FinancialPaymentOption {
  payId: string
  name: string
  state: string
  financialKind: FinanceKind
}
export type SessionPaymentFilter = {configured:boolean;methodIds:string[]}|null

export function permittedPaymentMethods<T extends {id:string}>(
  choices: readonly T[],
  policy: SessionPaymentFilter,
  financial: readonly FinancialPaymentOption[]
): T[] {
  if (!policy?.configured) return [...choices]
  const allowed = new Set(policy.methodIds)
  const valid = new Set(financial.filter(m => m.state === 'active' && m.financialKind !== 'UNKNOWN').map(m => m.payId))
  return choices.filter(choice => allowed.has(choice.id) && valid.has(choice.id))
}
export function paymentSelectionIssue(selectedId: string, policy: SessionPaymentFilter): string {
  if (!selectedId || !policy?.configured || policy.methodIds.includes(selectedId)) return ''
  return 'Este medio de pago no está habilitado en la caja del turno. Selecciona otro medio disponible.'
}
export function paymentSetupStatus(methods: readonly FinancialPaymentOption[], enabledIds: readonly string[]) {
  const selected = new Set(enabledIds)
  const invalid = methods.filter(m => selected.has(m.payId) && (m.state !== 'active' || m.financialKind === 'UNKNOWN'))
  return { ready: selected.size > 0 && invalid.length === 0, selectedCount: selected.size, invalid }
}
