import { minor, moneyNumber } from 'exact-cart-totals'
import type { FinancialKind, FinancialMethod } from '../../useCashManagement/types'

const KINDS: readonly FinancialKind[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER', 'UNKNOWN']
export type PaymentChoice = { id: string; name: string; icon: string }
export function resolveFinancialMethod(methods: readonly FinancialMethod[], selectedId: unknown) {
  const id = typeof selectedId === 'string' ? selectedId : ''
  if (!id) return { kind: undefined, issue: 'Selecciona un medio de pago.' }
  const matches = methods.filter(m => m.payId === id)
  if (matches.length !== 1) return { kind: undefined, issue: 'El medio seleccionado no aparece en el catálogo financiero vigente. Actualiza los medios de pago.' }
  const method = matches[0]
  if (method.state !== 'active') return { kind: undefined, issue: 'El medio de pago seleccionado no está activo. Selecciona otro.' }
  if (!KINDS.includes(method.financialKind) || method.financialKind === 'UNKNOWN') return { kind: undefined, issue: 'Clasifica este medio de pago en Finanzas → Medios de pago.' }
  return { kind: method.financialKind, issue: '' }
}
export function paymentChoices(legacy: readonly {payId?: string | null;name?: string | null;icon?: string | null}[], financial: readonly FinancialMethod[], controlled: boolean): PaymentChoice[] {
  if (!controlled) return legacy.filter(m => !!m.payId).map(m => ({id:m.payId!, name:m.name ?? '', icon:m.icon ?? ''}))
  // Legacy catalog is only decoration. Never determines payment validity.
  return financial.filter(m=>m.state==='active').map(m=>({id:m.payId,name:m.name,icon:legacy.find(x=>x.payId===m.payId)?.icon || 'IconSales'}))
}
export function verifyCheckoutAmounts(merchandise: unknown, delivery: unknown, checkout: {subtotal:unknown;delivery:unknown;total:unknown}, quote?: {merchandiseNet:string;posCharge:string;checkoutTotal:string}|null): string {
  try {
    const net=minor(merchandise), fee=minor(delivery), total=net+fee
    // Guard the GraphQL Float compatibility boundary, too.
    moneyNumber(total)
    if (minor(checkout.subtotal)!==net || minor(checkout.delivery)!==fee || minor(checkout.total)!==total) return 'Los importes del cobro no coinciden con la mercancía y el domicilio. Actualiza antes de cobrar.'
    if (quote && (minor(quote.merchandiseNet)!==net || minor(quote.posCharge)!==fee || minor(quote.checkoutTotal)!==total)) return 'La cotización financiera no coincide con el total POS. Actualiza el domicilio.'
    return ''
  } catch { return 'Importes financieros inválidos. Revisa el carrito.' }
}
export function paymentGate(input: {enabled:boolean;known:boolean;locked:boolean;issue:string;amountIssue:string;baseReady:boolean;baseMessage:string;confirmed:boolean;zero:boolean}) {
  const reason=input.issue || input.amountIssue || (!input.baseReady ? input.baseMessage || 'Revisa los datos del pago.' : '') || (input.enabled && !input.known ? 'Consultando la sesión de caja…' : '') || (input.locked ? 'Hay una operación pendiente.' : '')
  const ready=input.enabled&&input.known&&!input.locked&&!reason
  const confirmed=ready&&input.confirmed
  return {ready,confirmed,reason,canSubmit:!reason&&(!input.enabled||confirmed),message:reason||(input.enabled&&!confirmed?(input.zero?'Confirma la venta sin cobro.':'Confirma que recibiste el pago.'):'')}
}
