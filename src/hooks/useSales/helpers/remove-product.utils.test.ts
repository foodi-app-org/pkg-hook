import { handleRemoveProduct } from './remove-product.utils'

describe('handleRemoveProduct', () => {
  test('decrements product quantity and updates price when ProQuantity > 1', () => {
    const state = {
      counter: 5,
      totalAmount: 100,
      PRODUCT: [
        { pId: 'p1', ProQuantity: 3, ProPrice: 30 },
        { pId: 'p2', ProQuantity: 1, ProPrice: 20 }
      ]
    }
    const productsFood = [{ pId: 'p1', ProPrice: 10 }]
    const action = { payload: { pId: 'p1', ProQuantity: 3, ProPrice: 10 } }

    const result = handleRemoveProduct(state as any, action as any, productsFood as any)

    expect(result.counter).toBe(4)
    expect(result.totalAmount).toBe(90)
    expect(result.PRODUCT).toHaveLength(2)

    const updated = result.PRODUCT.find((p: any) => {return p.pId === 'p1'})
    expect(updated).toEqual({ pId: 'p1', ProQuantity: 2, ProPrice: 20 })

    const unchanged = result.PRODUCT.find((p: any) => {return p.pId === 'p2'})
    expect(unchanged).toEqual({ pId: 'p2', ProQuantity: 1, ProPrice: 20 })
  })

  test('removes product from PRODUCT when ProQuantity === 1', () => {
    const state = {
      counter: 2,
      totalAmount: 30,
      PRODUCT: [
        { pId: 'p1', ProQuantity: 1, ProPrice: 15 },
        { pId: 'p2', ProQuantity: 1, ProPrice: 15 }
      ]
    }
    const productsFood = [{ pId: 'p1', ProPrice: 15 }]
    const action = { payload: { pId: 'p1', ProQuantity: 1, ProPrice: 15 } }

    const result = handleRemoveProduct(state as any, action as any, productsFood as any)

    expect(result.counter).toBe(1)
    expect(result.totalAmount).toBe(15)
    expect(result.PRODUCT).toHaveLength(1)
    expect(result.PRODUCT.find((p: any) => {return p.pId === 'p1'})).toBeUndefined()
    expect(result.PRODUCT[0]).toEqual({ pId: 'p2', ProQuantity: 1, ProPrice: 15 })
  })
})