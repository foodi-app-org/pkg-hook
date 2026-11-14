import type { DeliveryDraft, DeliveryInput, DeliveryMethod, DeliveryQuote, DeliveryTotals } from './types'
const LIMIT = 9007199254740991n
export function cents(value: string): bigint {
  if (!/^(0|[1-9]\d{0,13})(\.\d{1,2})?$/.test(value)) throw new Error('Importe inválido: máximo dos decimales')
  const [whole, fraction = ''] = value.split('.')
  const result = BigInt(whole)*100n + BigInt(fraction.padEnd(2,'0'))
  if (result > LIMIT) throw new Error('Importe fuera del rango exacto')
  return result
}
export function decimal(value: bigint): string {
  if (value < 0n || value > LIMIT) throw new Error('Importe fuera del rango exacto')
  return `${value/100n}.${String(value%100n).padStart(2,'0')}`
}
export function numberMoney(value: string): number {
  const n = Number(cents(value))/100
  if (cents(String(n)) !== cents(value)) throw new Error('Importe no representable por el contrato Float')
  return n
}
export function formatDraftMoney(value: string): string { return decimal(cents(value.trim().replace(',', '.'))) }
export const blankDraft = (): DeliveryDraft => ({methodId:'',customerFee:'',providerCost:'',providerName:'',providerRef:''})
export function draftFor(method: DeliveryMethod): DeliveryDraft { return {...blankDraft(),methodId:method.id,customerFee:method.defaultFee ?? ''} }
export const merchantPaysCost = (mode: DeliveryMethod['mode']) => ['MERCHANT','MERCHANT_EXTERNAL','MERCHANT_SUBSIDIZED','MERCHANT_SUBSIDIZED_EXTERNAL'].includes(mode)
export function makeInput(method: DeliveryMethod, draft: DeliveryDraft): DeliveryInput {
  if (!method.active || method.id !== draft.methodId) throw new Error('Selecciona una modalidad activa')
  const input: DeliveryInput = {methodId:method.id,expectedRevision:method.revision}
  if (method.allowFeeOverride) {
    if (!draft.customerFee.trim()) throw new Error('Indica el valor del domicilio')
    input.customerFee = formatDraftMoney(draft.customerFee)
    if (cents(input.customerFee) === 0n) throw new Error('La tarifa debe ser positiva')
  }
  if (merchantPaysCost(method.mode) && draft.providerCost.trim()) input.providerCost = formatDraftMoney(draft.providerCost)
  if (method.providerType === 'THIRD_PARTY') {
    if (!draft.providerName.trim()) throw new Error('Identifica al domiciliario o empresa externa')
    if (draft.providerName.trim().length > 100 || draft.providerRef.trim().length > 100) throw new Error('Proveedor o referencia demasiado extensos')
    input.providerName = draft.providerName.trim()
    if (draft.providerRef.trim()) input.providerRef = draft.providerRef.trim()
  }
  return input
}
export function checkoutTotals(net: string, q: DeliveryQuote, tip='0.00'): DeliveryTotals {
  if (q.currency !== 'COP' || q.policyVersion !== 1) throw new Error('Política de domicilio no soportada')
  const merchandise = cents(net), pos=cents(q.posCharge), ext=cents(q.externalCharge), own=cents(q.merchantRevenue), third=cents(q.thirdPartyPayable), fee=cents(q.customerFee), gratuity=cents(tip)
  if (pos+ext!==fee || own+third!==pos || (pos>0n && ext>0n)) throw new Error('Cotización inconsistente')
  return {merchandiseNet:decimal(merchandise),posCharge:decimal(pos),checkoutTotal:decimal(merchandise+pos+gratuity),customerTotal:decimal(merchandise+pos+ext+gratuity),merchantRevenue:decimal(merchandise+own),externalCharge:decimal(ext),thirdPartyPayable:decimal(third),merchantCost:q.merchantCost===null?null:decimal(cents(q.merchantCost))}
}

/** Restore data only, never a quote. Unknown/malformed snapshots require reselection. */
export function readDeliveryDraft(value: unknown): DeliveryDraft|null {
  if (!value || typeof value!=='object') return null
  const source=value as Record<string,unknown>, clean=blankDraft()
  for (const key of Object.keys(clean) as (keyof DeliveryDraft)[]) {
    if (typeof source[key]!=='string'||source[key].length>120) return null
    clean[key]=source[key]
  }
  return clean
}
