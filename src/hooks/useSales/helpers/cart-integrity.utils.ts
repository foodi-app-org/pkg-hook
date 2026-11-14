import { addCents, moneyCents, settledMoneyCents, multiplyMoneyCents, percentMoneyCents, sumMoneyCents } from './money-minor.utils'
import { hasPricingSources, isCourtesyProduct } from './pricing.utils'
import { applyDiscountToCart, reapplyActiveDiscount, reconcileUnavailableDiscount, TypeDiscount } from './apply-discount-to-cart.utils'

/** Independently check line-item prices, discounts and the cash bridge.
 * Never count an invalid price as a free product. Never silently repair here.
 */
export interface CartIntegrity {
  valid: boolean
  gross: number
  discountable: number
  discount: number
  net: number
  issues: string[]
  lines: CartIntegrityLine[]
}
export interface CartIntegrityLine {
  index: number
  courtesy: boolean
  quantity: number | null
  grossCents: number
  netCents: number
  expectedDiscountCents: number | null
  reportedDiscountCents: number | null
  baseGrossCents: number | null
  baseNetCents: number | null
  source: { unitPrice: string | null; originalProPrice: string | null; ProPrice: string | null; discountAmount: string | null }
  extras: Array<{ index: number; quantity: number | null; grossCents: number | null; netCents: number | null; unitPrice: string | null; originalTotal: string | null; net: string | null }>
}
// Only numeric text is allowed into diagnostic data, never arbitrary strings.
const debugNumber = (value: unknown): string | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const text = String(value).trim()
  return text.length <= 100 && /^[+-]?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?$/i.test(text) ? text : null
}
export function auditCart(state: { PRODUCT?: unknown; discountType?: unknown; discountAmount?: unknown; discountPercent?: unknown }): CartIntegrity {
  const issues: string[] = []
  const lines: CartIntegrityLine[] = []
  let gross = 0, eligible = 0, net = 0, lineDiscount = 0
  const add = (a: number, b: number, label: string): number => {
    const value = addCents(a, b)
    if (value === null) issues.push(`${label}: importe fuera de rango`)
    return value ?? a
  }
  const products: any[] = Array.isArray(state.PRODUCT) ? state.PRODUCT : []
  if (!Array.isArray(state.PRODUCT)) issues.push('Carrito inválido')
  else if (!hasPricingSources(products)) issues.push('Precios originales o cantidades no verificables')
  const read = (value: unknown, label: string): number => {
    const parsed = settledMoneyCents(value)
    if (parsed === null) issues.push(`${label}: importe inválido`)
    return parsed ?? 0
  }
  for (const [i, product] of products.entries()) {
    if (!product || typeof product !== 'object') { issues.push(`Producto ${i + 1}: inválido`); continue }
    const label = `Producto ${i + 1}`
    const q = Number(product.ProQuantity)
    if (!Number.isSafeInteger(q) || q < 1) issues.push(`${label}: cantidad inválida`)
    const free = isCourtesyProduct(product.free)
    const baseNet = read(product.ProPrice, label)
    const baseGross = free ? 0 : product.unitPrice != null
      ? multiplyMoneyCents(product.unitPrice, product.ProQuantity)
      : moneyCents(product.originalProPrice ?? product.ProPrice)
    if (baseGross === null) issues.push(`${label}: precio base inválido`)
    if (baseNet > (baseGross ?? 0) || (free && baseNet !== 0)) issues.push(`${label}: precio neto inconsistente`)
    let rowGross = baseGross ?? 0, rowNet = baseNet
    const extras: CartIntegrityLine['extras'] = []
    if (product.dataExtra != null && !Array.isArray(product.dataExtra)) issues.push(`${label}: complementos inválidos`)
    for (const [extraIndex, extra] of (Array.isArray(product.dataExtra) ? product.dataExtra : []).entries()) {
      const qty = Number(extra?.quantity ?? 0)
      if (qty === 0) continue
      if (!Number.isSafeInteger(qty) || qty < 1) { issues.push(`${label}: cantidad de complemento inválida`); continue }
      const g = extra?.extraPrice != null ? multiplyMoneyCents(extra.extraPrice, qty) : moneyCents(extra?.originalNewExtraPrice ?? extra?.newExtraPrice)
      const n = read(extra?.newExtraPrice, `${label}: complemento`)
      if (g === null || n > g || (free && n !== g)) issues.push(`${label}: precio de complemento inconsistente`)
      extras.push({ index: extraIndex + 1, quantity: qty, grossCents: g, netCents: settledMoneyCents(extra?.newExtraPrice), unitPrice: debugNumber(extra?.extraPrice), originalTotal: debugNumber(extra?.originalNewExtraPrice), net: debugNumber(extra?.newExtraPrice) })
      rowGross = add(rowGross, g ?? 0, label)
      rowNet = add(rowNet, n, label)
    }
    gross = add(gross, rowGross, 'Bruto')
    net = add(net, rowNet, 'Neto')
    if (!free) eligible = add(eligible, rowGross, 'Base descontable')
    lines.push({ index: i + 1, courtesy: free, quantity: Number.isFinite(q) ? q : null,
      grossCents: rowGross, netCents: rowNet, expectedDiscountCents: rowNet <= rowGross ? rowGross - rowNet : null,
      reportedDiscountCents: settledMoneyCents(product.discountAmount ?? 0), baseGrossCents: baseGross,
      baseNetCents: settledMoneyCents(product.ProPrice), source: {
        unitPrice: debugNumber(product.unitPrice), originalProPrice: debugNumber(product.originalProPrice),
        ProPrice: debugNumber(product.ProPrice), discountAmount: debugNumber(product.discountAmount)
      }, extras })
    if (rowNet <= rowGross) {
      const reduction = rowGross - rowNet
      const reported = read(product.discountAmount ?? 0, `${label}: descuento`)
      if (reported !== reduction) issues.push(`${label}: descuento no coincide con sus importes`)
      lineDiscount = add(lineDiscount, reduction, 'Descuento')
    } else issues.push(`${label}: neto superior al bruto`)
  }
  const discount = read(state.discountAmount ?? 0, 'Descuento global')
  const type = state.discountType ?? 'PERCENT'
  const percent = state.discountPercent ?? 0
  const expected = type === 'PERCENT' ? percentMoneyCents(eligible, percent) : type === 'AMOUNT' ? Math.min(eligible, discount) : null
  if (expected === null || expected !== discount) issues.push('Descuento global no coincide con su base')
  if (discount > eligible || lineDiscount !== discount || gross - discount !== net) issues.push('El bruto, descuento y neto del carrito no coinciden')
  return { valid: issues.length === 0, gross: gross / 100, discountable: eligible / 100, discount: discount / 100, net: net / 100, issues, lines }
}

/** GraphQL DiscountInput.value is Int; preserve the original unit, never turn
 * a fixed amount into a percentage. Reject what the contract cannot express. */
export function validateDiscountPayload(type: string, value: number): string {
  if (type !== 'PERCENT' && type !== 'AMOUNT') return 'Tipo de descuento inválido.'
  if (!Number.isInteger(value) || value < 0 || value > (type === 'PERCENT' ? 100 : 2147483647)) {
    return 'El contrato actual de descuentos solo admite valores enteros. Ajusta el descuento antes de confirmar.'
  }
  return ''
}

/** The reducer calls this only for price-affecting actions, after stock checks.
 * Rebuild the current discount from original bases, never from discounted net.
 * Reject stale visual-only discounts (percentage with no confirmed amount). */
export function repriceCartAfterMutation<T extends { PRODUCT?: unknown; discountAmount?: number; discountPercent?: number }>(state: T): T {
  if (!hasPricingSources(state.PRODUCT)) return state
  const reconciled = reconcileUnavailableDiscount(state)
  return Number(reconciled.discountAmount) > 0
    ? reapplyActiveDiscount(reconciled) as T
    : applyDiscountToCart(reconciled, { type: TypeDiscount.PERCENT, value: 0 }) as T
}

/** The GraphQL payload independently contains line net prices and extra totals.
 * Check its monetary bridge just before sending. */
export function auditPayloadSubtotal(lines: readonly { ProPrice: unknown; dataExtra?: readonly { newExtraPrice?: unknown }[]; totalExtra?: unknown }[], expected: number): boolean {
  const values: unknown[] = []
  for (const line of lines) {
    const extras = (line.dataExtra ?? []).map(extra => extra.newExtraPrice)
    const extraCents = sumMoneyCents(extras)
    if (extraCents === null || extras.some(value => settledMoneyCents(value) === null) || settledMoneyCents(line.ProPrice) === null || settledMoneyCents(line.totalExtra) !== extraCents) return false
    values.push(line.ProPrice, ...extras)
  }
  const total = sumMoneyCents(values)
  return total !== null && total === settledMoneyCents(expected)
}

/** Safe support snapshot: no product/customer/store IDs, names, cookies or tokens. */
export function buildCartIntegrityDebug(audit: CartIntegrity, checkout: {
  kind: string; receivedMode?: string; subtotal: number; delivery: number; total: number;
  received: number | null; change: number; missing: number; canSubmit: boolean; amountsValid: boolean;
}, discountType: unknown, discountPercent: unknown, discountAmount: unknown, payloadMatches = true): string {
  return JSON.stringify({ version: '3.0.0', currency: 'COP', lineAmountsUnit: 'hundredths-of-COP', auditTotalsUnit: 'COP', payloadMatches, audit,
    discount: { type: discountType === 'AMOUNT' ? 'AMOUNT' : discountType === 'PERCENT' ? 'PERCENT' : 'unknown',
      percent: typeof discountPercent === 'number' && Number.isFinite(discountPercent) ? discountPercent : null,
      amountCents: settledMoneyCents(discountAmount ?? 0) },
    checkout: { kind: checkout.kind, receivedMode: checkout.receivedMode,
      subtotalCents: settledMoneyCents(checkout.subtotal), deliveryCents: settledMoneyCents(checkout.delivery),
      totalCents: settledMoneyCents(checkout.total), receivedCents: settledMoneyCents(checkout.received),
      changeCents: settledMoneyCents(checkout.change), missingCents: settledMoneyCents(checkout.missing),
      canSubmit: checkout.canSubmit, amountsValid: checkout.amountsValid } }, null, 2)
}
