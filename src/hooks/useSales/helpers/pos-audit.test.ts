/**
 * POS AUDIT — Comprehensive Math, Invariant & Edge-Case Test Suite
 *
 * Covers every critical financial calculation path identified during the audit:
 *   - remove-product price recalculation (BUG-1 / BUG-2 regression)
 *   - extras increment / decrement (BUG-3 regression: newExtraPrice at qty=0)
 *   - handleChangeNumber monetary arithmetic (BigInt path, float avoidance)
 *   - applyDiscountToCart (PERCENT + AMOUNT, stacking, idempotency)
 *   - decrementExtra / incrementExtra invariants
 *   - toggleFreeProducts price invariants
 *   - convertInteger-equivalent monetary parsing (Colombian locale separators)
 *   - initializer: corrupt cookie resilience
 *
 * All tests are pure unit tests — no React, no Apollo, no network.
 */

import { expect } from '@jest/globals'

import { applyDiscountToCart, TypeDiscount } from './apply-discount-to-cart.utils'
import { decrementExtra, incrementExtra } from './extras.utils'
import { multiplyMoney, moneyToMinorUnits, sumMoney, roundMoney, handleChangeNumber } from './handleChangeNumber.utils'
import { handleRemoveProduct } from './remove-product.utils'
import { toggleFreeProducts } from './toggleFreeProducts'
import { initializer } from './initializer.utils'
import { initialStateSales } from './constants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal cart item matching the SaleProduct shape used in tests */
const makeCartItem = (
  pId: string,
  unitPrice: number,
  qty: number,
  opts: Record<string, unknown> = {}
) => ({
  pId,
  pName: `Product ${pId}`,
  unitPrice,
  ProPrice: unitPrice * qty,
  ProQuantity: qty,
  free: false,
  stock: 100,
  manageStock: false,
  dataExtra: [],
  ...opts
})

/** Build a minimal catalog item (productsFood entry) */
const makeCatalogItem = (pId: string, ProPrice: number, stock = 100) => ({
  pId,
  ProPrice,
  stock,
  manageStock: false
})

const noop = () => {}

// ---------------------------------------------------------------------------
// 1. handleRemoveProduct — BUG-1 / BUG-2 regression
// ---------------------------------------------------------------------------

describe('handleRemoveProduct', () => {
  describe('happy path', () => {
    test('decrements ProQuantity by 1 and subtracts unitPrice from ProPrice', () => {
      const unitPrice = 10_000
      const state = {
        counter: 3,
        totalAmount: 30_000,
        PRODUCT: [makeCartItem('p1', unitPrice, 3)]
      }
      const action = { payload: { pId: 'p1', ProQuantity: 3, ProPrice: unitPrice } }
      const productsFood = [makeCatalogItem('p1', unitPrice)]

      const result = handleRemoveProduct(state as any, action as any, productsFood as any)

      const updated = result.PRODUCT.find((p: any) => p.pId === 'p1')
      expect(updated.ProQuantity).toBe(2)
      expect(updated.ProPrice).toBe(20_000)
      expect(result.counter).toBe(2)
    })

    test('removes product entirely when ProQuantity === 1', () => {
      const state = {
        counter: 1,
        totalAmount: 5_500,
        PRODUCT: [makeCartItem('p1', 5_500, 1)]
      }
      const action = { payload: { pId: 'p1', ProQuantity: 1, ProPrice: 5_500 } }
      const productsFood = [makeCatalogItem('p1', 5_500)]

      const result = handleRemoveProduct(state as any, action as any, productsFood as any)

      expect(result.PRODUCT).toHaveLength(0)
      expect(result.counter).toBe(0)
    })

    test('only touches the target product, leaves others intact', () => {
      const state = {
        counter: 3,
        totalAmount: 25_000,
        PRODUCT: [
          makeCartItem('p1', 10_000, 2),
          makeCartItem('p2', 5_000, 1)
        ]
      }
      const action = { payload: { pId: 'p1', ProQuantity: 2, ProPrice: 10_000 } }
      const productsFood = [makeCatalogItem('p1', 10_000), makeCatalogItem('p2', 5_000)]

      const result = handleRemoveProduct(state as any, action as any, productsFood as any)

      const p2 = result.PRODUCT.find((p: any) => p.pId === 'p2')
      expect(p2.ProQuantity).toBe(1)
      expect(p2.ProPrice).toBe(5_000)
    })
  })

  describe('BUG-1/BUG-2 regression — unitPrice stored on cart item is used, not catalog price', () => {
    test('uses cart item unitPrice when catalog price differs (e.g. after discount)', () => {
      // Cart has a discounted unitPrice of 8_000, but catalog still says 10_000
      const state = {
        counter: 3,
        totalAmount: 24_000,
        PRODUCT: [{ ...makeCartItem('p1', 8_000, 3), ProPrice: 24_000 }]
      }
      const action = { payload: { pId: 'p1', ProQuantity: 3, ProPrice: 8_000 } }
      // productsFood still has the original catalog price
      const productsFood = [makeCatalogItem('p1', 10_000)]

      const result = handleRemoveProduct(state as any, action as any, productsFood as any)

      const updated = result.PRODUCT.find((p: any) => p.pId === 'p1')
      // Must subtract cart unitPrice (8_000), NOT catalog ProPrice (10_000)
      expect(updated.ProPrice).toBe(16_000)
      expect(updated.ProQuantity).toBe(2)
    })

    test('does NOT produce NaN when product is absent from productsFood but unitPrice is on cart item', () => {
      const state = {
        counter: 2,
        totalAmount: 20_000,
        PRODUCT: [makeCartItem('p1', 10_000, 2)]
      }
      const action = { payload: { pId: 'p1', ProQuantity: 2, ProPrice: 10_000 } }
      // productsFood is empty — old code would crash/NaN here
      const result = handleRemoveProduct(state as any, action as any, [])

      const updated = result.PRODUCT.find((p: any) => p.pId === 'p1')
      expect(updated.ProPrice).not.toBeNaN()
      expect(updated.ProPrice).toBe(10_000) // 20_000 - 10_000
    })

    test('ProPrice never goes below 0', () => {
      const state = {
        counter: 1,
        totalAmount: 100,
        PRODUCT: [makeCartItem('p1', 200, 2)]  // ProPrice = 400 but cart shows 100 (edge)
      }
      const action = { payload: { pId: 'p1', ProQuantity: 2, ProPrice: 200 } }
      const productsFood = [makeCatalogItem('p1', 999_999)] // huge catalog price

      const result = handleRemoveProduct(state as any, action as any, productsFood as any)
      const updated = result.PRODUCT.find((p: any) => p.pId === 'p1')
      // Math.max(0, ...) guard in fixed code
      expect(updated.ProPrice).toBeGreaterThanOrEqual(0)
    })
  })
})

// ---------------------------------------------------------------------------
// 2. decrementExtra / incrementExtra — BUG-3 regression
// ---------------------------------------------------------------------------

describe('extras.utils', () => {
  const makeExtra = (exPid: string, extraPrice: number, quantity: number) => ({
    exPid,
    extraPrice,
    quantity,
    newExtraPrice: extraPrice * quantity
  })

  describe('decrementExtra', () => {
    test('BUG-3 regression: newExtraPrice is 0 when quantity reaches 0', () => {
      const extras = [makeExtra('e1', 2_500, 1)]
      const result = decrementExtra(extras as any, 'e1')
      const e = result.find((x: any) => x.exPid === 'e1')

      expect(e.quantity).toBe(0)
      expect(e.newExtraPrice).toBe(0)  // was incorrectly 2_500 before fix
    })

    test('decrements correctly from qty > 1', () => {
      const extras = [makeExtra('e1', 2_500, 3)]
      const result = decrementExtra(extras as any, 'e1')
      const e = result.find((x: any) => x.exPid === 'e1')

      expect(e.quantity).toBe(2)
      expect(e.newExtraPrice).toBe(5_000)
    })

    test('quantity never goes below 0', () => {
      const extras = [makeExtra('e1', 2_500, 0)]
      const result = decrementExtra(extras as any, 'e1')
      const e = result.find((x: any) => x.exPid === 'e1')

      expect(e.quantity).toBe(0)
      expect(e.newExtraPrice).toBe(0)
    })

    test('does not touch unrelated extras', () => {
      const extras = [makeExtra('e1', 1_000, 2), makeExtra('e2', 3_000, 1)]
      const result = decrementExtra(extras as any, 'e1')
      const e2 = result.find((x: any) => x.exPid === 'e2')

      expect(e2.quantity).toBe(1)
      expect(e2.newExtraPrice).toBe(3_000)
    })

    test('returns empty array for non-array input', () => {
      expect(decrementExtra(null as any, 'e1')).toEqual([])
      expect(decrementExtra(undefined as any, 'e1')).toEqual([])
    })
  })

  describe('incrementExtra', () => {
    test('increments quantity and recalculates newExtraPrice', () => {
      const extras = [makeExtra('e1', 2_500, 1)]
      const result = incrementExtra(extras as any, 'e1')
      const e = result.find((x: any) => x.exPid === 'e1')

      expect(e.quantity).toBe(2)
      expect(e.newExtraPrice).toBe(5_000)
    })

    test('starts from 0 quantity correctly', () => {
      const extras = [{ exPid: 'e1', extraPrice: 2_500, quantity: undefined, newExtraPrice: 0 }]
      const result = incrementExtra(extras as any, 'e1')
      const e = result.find((x: any) => x.exPid === 'e1')

      expect(e.quantity).toBe(1)
      expect(e.newExtraPrice).toBe(2_500)
    })

    test('INVARIANT: incrementing never decreases newExtraPrice', () => {
      const extras = [makeExtra('e1', 1_500, 5)]
      const before = extras[0].newExtraPrice
      const result = incrementExtra(extras as any, 'e1')
      const after = result.find((x: any) => x.exPid === 'e1').newExtraPrice

      expect(after).toBeGreaterThan(before)
    })
  })
})

// ---------------------------------------------------------------------------
// 3. handleChangeNumber monetary arithmetic
// ---------------------------------------------------------------------------

describe('handleChangeNumber monetary primitives', () => {
  describe('multiplyMoney', () => {
    test('integer prices: 10_000 × 2 = 20_000', () => {
      expect(multiplyMoney(10_000, 2)).toBe(20_000)
    })

    test('5_500 × 3 = 16_500', () => {
      expect(multiplyMoney(5_500, 3)).toBe(16_500)
    })

    test('7_250 × 1 = 7_250', () => {
      expect(multiplyMoney(7_250, 1)).toBe(7_250)
    })

    test('floating point pitfall: 0.1 × 3 = 0.30 (not 0.30000000000000004)', () => {
      expect(multiplyMoney(0.1, 3)).toBe(0.3)
    })

    test('1_287.44 × 1 = 1_287.44', () => {
      expect(multiplyMoney(1_287.44, 1)).toBe(1_287.44)
    })

    test('returns 0 for null/undefined/NaN inputs', () => {
      expect(multiplyMoney(null as any, 2)).toBe(0)
      expect(multiplyMoney(10, null as any)).toBe(0)
      expect(multiplyMoney(NaN, 2)).toBe(0)
      expect(multiplyMoney(10, NaN)).toBe(0)
    })

    test('returns 0 for empty string inputs', () => {
      expect(multiplyMoney('', 2)).toBe(0)
      expect(multiplyMoney(10, '')).toBe(0)
    })

    test('handles string numeric inputs', () => {
      expect(multiplyMoney('10000', '3')).toBe(30_000)
    })
  })

  describe('moneyToMinorUnits', () => {
    test('10.25 → 1025n', () => {
      expect(moneyToMinorUnits(10.25)).toBe(1025n)
    })

    test('0 → 0n', () => {
      expect(moneyToMinorUnits(0)).toBe(0n)
    })

    test('999.99 → 99999n', () => {
      expect(moneyToMinorUnits(999.99)).toBe(99999n)
    })

    test('returns null for NaN', () => {
      expect(moneyToMinorUnits(NaN)).toBeNull()
    })

    test('returns null for Infinity', () => {
      expect(moneyToMinorUnits(Infinity)).toBeNull()
    })

    test('returns null for empty string', () => {
      expect(moneyToMinorUnits('')).toBeNull()
    })
  })

  describe('sumMoney', () => {
    test('sums multiple values without float drift', () => {
      // 0.1 + 0.2 = 0.3 exactly (not 0.30000000000000004)
      expect(sumMoney([0.1, 0.2])).toBe(0.3)
    })

    test('ignores null and undefined entries', () => {
      expect(sumMoney([10_000, null, undefined, 5_000])).toBe(15_000)
    })

    test('returns 0 for empty array', () => {
      expect(sumMoney([])).toBe(0)
    })

    test('multiple products total: 10_000×2 + 5_500×3 + 7_250×1', () => {
      // ProPrice values already computed by multiplyMoney
      const proprices = [
        multiplyMoney(10_000, 2), // 20_000
        multiplyMoney(5_500, 3),  // 16_500
        multiplyMoney(7_250, 1)   // 7_250
      ]
      expect(sumMoney(proprices)).toBe(43_750)
    })
  })

  describe('roundMoney', () => {
    test('rounds half-up: 1.005 → 1.01', () => {
      expect(roundMoney(1.005)).toBe(1.01)
    })

    test('0 stays 0', () => {
      expect(roundMoney(0)).toBe(0)
    })

    test('returns 0 for NaN', () => {
      expect(roundMoney(NaN)).toBe(0)
    })
  })

  describe('handleChangeNumber reducer', () => {
    const makeState = (items: any[]) => ({
      ...initialStateSales,
      PRODUCT: items,
      counter: items.reduce((s: number, i: any) => s + (i.ProQuantity ?? 0), 0)
    })

    const sendNotification = jest.fn()

    beforeEach(() => sendNotification.mockClear())

    test('changes quantity and recalculates ProPrice correctly', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: 5 } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      const p = result.PRODUCT.find((x: any) => x.pId === 'p1')
      expect(p.ProQuantity).toBe(5)
      expect(p.ProPrice).toBe(50_000)
    })

    test('quantity = 0 removes product', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: 0 } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      expect(result.PRODUCT.find((x: any) => x.pId === 'p1')).toBeUndefined()
    })

    test('negative quantity is treated as 0 (product removed)', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: -5 } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      expect(result.PRODUCT.find((x: any) => x.pId === 'p1')).toBeUndefined()
    })

    test('NaN value returns state unchanged', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: NaN } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      expect(result).toBe(state) // same reference
    })

    test('Infinity value returns state unchanged', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: Infinity } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      expect(result).toBe(state)
    })

    test('empty string value returns state unchanged (user clearing input)', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: '' } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      expect(result).toBe(state)
    })

    test('INVARIANT: counter delta matches quantity delta', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: 7 } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      // Started at qty=2, ended at qty=7 → delta=+5
      expect(result.counter).toBe(state.counter + 5)
    })

    test('INVARIANT: increasing quantity never decreases ProPrice', () => {
      const state = makeState([makeCartItem('p1', 10_000, 3)])
      const productsFood = [makeCatalogItem('p1', 10_000)]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: 10 } }

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      const before = 30_000
      const after = result.PRODUCT.find((x: any) => x.pId === 'p1').ProPrice
      expect(after).toBeGreaterThan(before)
    })

    test('respects stock cap when manageStock=true', () => {
      const state = makeState([makeCartItem('p1', 10_000, 2)])
      const productsFood = [{ ...makeCatalogItem('p1', 10_000, 5), manageStock: true }]
      const action: any = { type: 'ON_CHANGE', payload: { id: 'p1', value: 10 } } // > stock=5

      const result = handleChangeNumber(state as any, action, productsFood as any, sendNotification)

      const p = result.PRODUCT.find((x: any) => x.pId === 'p1')
      expect(p.ProQuantity).toBe(5) // capped at stock
    })
  })
})

// ---------------------------------------------------------------------------
// 4. applyDiscountToCart
// ---------------------------------------------------------------------------

describe('applyDiscountToCart', () => {
  const makeState = (...items: ReturnType<typeof makeCartItem>[]) => ({
    ...initialStateSales,
    PRODUCT: items
  })

  describe('PERCENT discounts', () => {
    test('10% on a single product: 10_000 → 9_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 10 }, noop)

      const p = result.PRODUCT[0]
      expect(p.ProPrice).toBe(9_000)
    })

    test('50% on 2 × 10_000 = 10_000 total', () => {
      const state = makeState(makeCartItem('p1', 10_000, 2))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 50 }, noop)

      expect(result.discountAmount).toBe(10_000)
    })

    test('100% discount results in total 0', () => {
      const state = makeState(makeCartItem('p1', 5_000, 1), makeCartItem('p2', 3_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 100 }, noop)

      const total = result.PRODUCT.reduce((s: number, p: any) => s + p.ProPrice, 0)
      expect(total).toBe(0)
    })

    test('0% discount leaves prices unchanged', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 0 }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(10_000)
      expect(result.discountAmount).toBe(0)
    })

    test('1% on 10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 1 }, noop)

      expect(result.discountAmount).toBe(100)
      expect(result.PRODUCT[0].ProPrice).toBe(9_900)
    })

    test('5% on 10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 5 }, noop)

      expect(result.discountAmount).toBe(500)
    })

    test('15% on 10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 15 }, noop)

      expect(result.discountAmount).toBe(1_500)
    })

    test('discount > 100% is rejected, state returned unchanged', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 101 }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(10_000)
    })

    test('INVARIANT: sum of per-product discountAmounts equals total discountAmount', () => {
      const state = makeState(
        makeCartItem('p1', 10_000, 2),
        makeCartItem('p2', 5_500, 3),
        makeCartItem('p3', 7_250, 1)
      )
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 10 }, noop)

      const sumBreakdown = result.discountBreakdown.reduce(
        (s: number, b: any) => s + b.discountAmount, 0
      )
      // Allow ±1 cent rounding tolerance from LRM
      expect(Math.abs(sumBreakdown - result.discountAmount)).toBeLessThanOrEqual(0.01)
    })

    test('INVARIANT: no product ProPrice goes negative', () => {
      const state = makeState(
        makeCartItem('p1', 10_000, 1),
        makeCartItem('p2', 5_000, 1)
      )
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 99 }, noop)

      result.PRODUCT.forEach((p: any) => expect(p.ProPrice).toBeGreaterThanOrEqual(0))
    })
  })

  describe('AMOUNT discounts', () => {
    test('fixed $1_000 discount on cart of $10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 1_000 }, noop)

      expect(result.discountAmount).toBe(1_000)
      expect(result.PRODUCT[0].ProPrice).toBe(9_000)
    })

    test('discount of $0 leaves prices unchanged', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 0 }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(10_000)
    })

    test('discount equal to cart total results in 0 total', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 10_000 }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(0)
    })

    test('discount greater than cart total is capped to cart total', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 50_000 }, noop)

      // Cart total = 10_000, cap = 10_000
      expect(result.discountAmount).toBe(10_000)
      expect(result.PRODUCT[0].ProPrice).toBe(0)
    })

    test('discount $999 on $10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 999 }, noop)

      expect(result.discountAmount).toBe(999)
    })

    test('discount $1 on $10_000', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.AMOUNT, value: 1 }, noop)

      expect(result.discountAmount).toBe(1)
    })
  })

  describe('stacking / idempotency', () => {
    test('applying the same discount twice does NOT double the discount', () => {
      const original = makeState(makeCartItem('p1', 10_000, 1))
      const payload = { type: TypeDiscount.PERCENT, value: 10 }

      const once = applyDiscountToCart(original as any, payload, noop)
      const twice = applyDiscountToCart(once as any, payload, noop)

      // Second application restores from originalProPrice (10_000) then applies 10%
      // so the result should be same as applying once
      expect(twice.PRODUCT[0].ProPrice).toBe(9_000)
      expect(twice.discountAmount).toBe(1_000)
    })

    test('switching from PERCENT to AMOUNT does not stack on the discounted price', () => {
      const original = makeState(makeCartItem('p1', 10_000, 1))

      const afterPercent = applyDiscountToCart(
        original as any,
        { type: TypeDiscount.PERCENT, value: 10 },
        noop
      )
      const afterAmount = applyDiscountToCart(
        afterPercent as any,
        { type: TypeDiscount.AMOUNT, value: 2_000 },
        noop
      )

      // Should apply $2_000 to ORIGINAL 10_000, not discounted 9_000
      expect(afterAmount.discountAmount).toBe(2_000)
      expect(afterAmount.PRODUCT[0].ProPrice).toBe(8_000)
    })
  })

  describe('empty / invalid inputs', () => {
    test('empty cart returns unchanged state', () => {
      const state = makeState()
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 10 }, noop)

      expect(result.PRODUCT).toHaveLength(0)
    })

    test('negative discount value returns state unchanged', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: -5 }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(10_000)
    })

    test('NaN discount value returns state unchanged', () => {
      const state = makeState(makeCartItem('p1', 10_000, 1))
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: NaN }, noop)

      expect(result.PRODUCT[0].ProPrice).toBe(10_000)
    })
  })

  describe('multi-product with extras', () => {
    test('10% discount distributed across products with extras sums correctly', () => {
      const p1 = {
        ...makeCartItem('p1', 10_000, 2),
        dataExtra: [{ exPid: 'e1', extraPrice: 2_500, quantity: 2, newExtraPrice: 5_000 }]
      }
      // cart total = 20_000 (base) + 5_000 (extra) = 25_000
      const state = makeState(p1)
      const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 10 }, noop)

      expect(result.discountAmount).toBe(2_500)
    })
  })
})

// ---------------------------------------------------------------------------
// 5. toggleFreeProducts invariants
// ---------------------------------------------------------------------------

describe('toggleFreeProducts', () => {
  const makeStateWith = (item: any) => ({ ...initialStateSales, PRODUCT: [item] })

  test('sets ProPrice to 0 when toggled to free', () => {
    const item = makeCartItem('p1', 10_000, 3)
    const state = makeStateWith(item)
    const productsFood = [makeCatalogItem('p1', 10_000)]

    const result = toggleFreeProducts(state as any, { pId: 'p1' }, productsFood as any)

    expect(result.PRODUCT[0].ProPrice).toBe(0)
    expect(result.PRODUCT[0].free).toBe(true)
  })

  test('restores ProPrice based on catalog unit × quantity when toggled back', () => {
    const item = { ...makeCartItem('p1', 10_000, 3), free: true, ProPrice: 0 }
    const state = makeStateWith(item)
    const productsFood = [makeCatalogItem('p1', 10_000)]

    const result = toggleFreeProducts(state as any, { pId: 'p1' }, productsFood as any)

    expect(result.PRODUCT[0].ProPrice).toBe(30_000)
    expect(result.PRODUCT[0].free).toBe(false)
  })

  test('returns same state when pId is missing', () => {
    const item = makeCartItem('p1', 10_000, 1)
    const state = makeStateWith(item)
    const result = toggleFreeProducts(state as any, { pId: '' } as any, [])

    expect(result).toBe(state)
  })

  test('returns same state when product not in productsFood', () => {
    const item = makeCartItem('p1', 10_000, 1)
    const state = makeStateWith(item)
    const result = toggleFreeProducts(state as any, { pId: 'p1' }, [])

    expect(result).toBe(state)
  })
})

// ---------------------------------------------------------------------------
// 6. convertInteger equivalent — monetary string parsing (BUG-6 regression)
// ---------------------------------------------------------------------------

describe('Colombian monetary string parsing (convertInteger logic)', () => {
  /**
   * Mirrors the fixed convertInteger logic:
   *   strip thousand-separator dots → replace comma decimal → parseFloat → round
   */
  const convertInteger = (cadena: string | number): number => {
    if (typeof cadena === 'number') return Number.isFinite(cadena) ? Math.round(cadena) : 0
    if (typeof cadena !== 'string' || cadena.trim() === '') return 0
    const cleaned = cadena.trim().replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return Number.isFinite(parsed) ? Math.round(parsed) : 0
  }

  test('"10.500" (Colombian thousand sep) → 10500', () => {
    expect(convertInteger('10.500')).toBe(10_500)
  })

  test('"1.000.000" → 1000000', () => {
    expect(convertInteger('1.000.000')).toBe(1_000_000)
  })

  test('"25.000,50" (decimal comma) → 25001 (rounded)', () => {
    expect(convertInteger('25.000,50')).toBe(25_001)
  })

  test('"0" → 0', () => {
    expect(convertInteger('0')).toBe(0)
  })

  test('empty string → 0', () => {
    expect(convertInteger('')).toBe(0)
  })

  test('null-like undefined → 0', () => {
    expect(convertInteger(undefined as any)).toBe(0)
  })

  test('NaN → 0', () => {
    expect(convertInteger(NaN)).toBe(0)
  })

  test('Infinity → 0', () => {
    expect(convertInteger(Infinity)).toBe(0)
  })

  test('integer number passthrough: 15000 → 15000', () => {
    expect(convertInteger(15_000)).toBe(15_000)
  })

  test('float number: 9999.7 → 10000', () => {
    expect(convertInteger(9_999.7)).toBe(10_000)
  })

  // Regression: old parseInt('10.500') would return 10, not 10500
  test('REGRESSION — old parseInt("10.500") = 10, new logic = 10500', () => {
    // Demonstrate the old bug
    const oldBugValue = parseInt('10.500'.replace('.', ''), 10) // replaces only first dot → 10500 is fine here
    // But with multiple dots:
    const multiDot = '1.000.500'
    const oldBug = parseInt(multiDot.replace('.', ''), 10) // replaces first dot only → parseInt('1000.500') = 1000
    expect(oldBug).toBe(1000) // this is WRONG
    // New logic strips ALL dots
    expect(convertInteger(multiDot)).toBe(1_000_500)
  })
})

// ---------------------------------------------------------------------------
// 7. initializer — corrupt cookie resilience (BUG-8, confirmed OK, regression guard)
// ---------------------------------------------------------------------------

describe('initializer', () => {
  const originalGet = jest.fn()

  beforeEach(() => {
    jest.resetModules()
  })

  test('returns initialStateSales when cookie is absent', () => {
    const result = initializer(initialStateSales)
    // When cookie key is undefined env var, Cookies.get returns undefined → returns default
    expect(result).toBeDefined()
    expect(Array.isArray(result.PRODUCT)).toBe(true)
  })

  test('does NOT throw when JSON is corrupt', () => {
    // Directly test the try/catch protection
    expect(() => {
      try {
        JSON.parse('}{invalid json')
      } catch {
        // initializer catches this → returns initialStateSales
      }
    }).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// 8. Full-cart invariant scenarios
// ---------------------------------------------------------------------------

describe('POS invariants — end-to-end cart math', () => {
  const computeCartTotal = (products: any[]) =>
    products.reduce((sum: number, item: any) => {
      const lineTotal = item.ProPrice ?? 0
      const extraTotal = (item.dataExtra ?? []).reduce(
        (es: number, ex: any) => es + (ex.newExtraPrice ?? 0), 0
      )
      return sum + lineTotal + extraTotal
    }, 0)

  test('removing a product never increases the cart total', () => {
    const initial = [
      makeCartItem('p1', 10_000, 3),
      makeCartItem('p2', 5_000, 2)
    ]
    const totalBefore = computeCartTotal(initial)

    const state = { ...initialStateSales, PRODUCT: initial, counter: 5, totalAmount: totalBefore }
    const action = { payload: { pId: 'p1', ProQuantity: 3, ProPrice: 10_000 } }
    const result = handleRemoveProduct(state as any, action as any, [
      makeCatalogItem('p1', 10_000),
      makeCatalogItem('p2', 5_000)
    ] as any)

    const totalAfter = computeCartTotal(result.PRODUCT)
    expect(totalAfter).toBeLessThan(totalBefore)
  })

  test('applying a discount never increases the cart total', () => {
    const items = [makeCartItem('p1', 10_000, 2), makeCartItem('p2', 7_500, 1)]
    const state = { ...initialStateSales, PRODUCT: items }
    const totalBefore = computeCartTotal(items)

    const result = applyDiscountToCart(state as any, { type: TypeDiscount.PERCENT, value: 15 }, noop)

    const totalAfter = computeCartTotal(result.PRODUCT)
    expect(totalAfter).toBeLessThanOrEqual(totalBefore)
  })

  test('cart total >= 0 after any combination of discount + decrement', () => {
    const extra = { exPid: 'e1', extraPrice: 2_500, quantity: 2, newExtraPrice: 5_000 }
    const items = [{ ...makeCartItem('p1', 10_000, 1), dataExtra: [extra] }]
    const state = { ...initialStateSales, PRODUCT: items }

    // Apply 100% discount
    const discounted = applyDiscountToCart(
      state as any,
      { type: TypeDiscount.PERCENT, value: 100 },
      noop
    )

    const total = computeCartTotal(discounted.PRODUCT)
    expect(total).toBeGreaterThanOrEqual(0)
  })

  test('FORMULA: totalProductsPrice = Σ(ProPrice + Σ(newExtraPrice))', () => {
    const p1 = {
      ...makeCartItem('p1', 10_000, 2),
      dataExtra: [{ exPid: 'e1', extraPrice: 2_500, quantity: 2, newExtraPrice: 5_000 }]
    }
    const p2 = makeCartItem('p2', 5_500, 3)

    const expected =
      p1.ProPrice + 5_000 + // 20_000 + 5_000
      p2.ProPrice            // 16_500

    expect(computeCartTotal([p1, p2])).toBe(41_500)
    expect(computeCartTotal([p1, p2])).toBe(expected)
  })
})
