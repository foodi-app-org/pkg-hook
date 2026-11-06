import {
  processBarcode,
  BARCODE_DEDUP_WINDOW_MS,
  type FindProductByBarcodeResult,
  type DedupRef
} from './processBarcode.utils'
import { normalizeBarcode } from './resolveProductByBarcode.utils'

import type { Product } from 'typesdefs'

const makeResult = (
  overrides: Partial<FindProductByBarcodeResult> = {}
): FindProductByBarcodeResult => ({
  success: true,
  status: 'FOUND',
  message: 'ok',
  barcode: '7700000000007',
  data: { pId: 'p1', pName: 'Coca-Cola' } as Product,
  ...overrides
})

describe('processBarcode (controlador central de escaneo)', () => {
  const baseDeps = () => {
    const addProductToCart = jest.fn()
    const dedupRef: { current: DedupRef } = { current: { code: '', at: 0 } }
    return { addProductToCart, dedupRef }
  }

  it('INVALID cuando el código normalizado queda vacío (no consulta backend)', async () => {
    const { addProductToCart, dedupRef } = baseDeps()
    const findByBarcode = jest.fn()

    const outcome = await processBarcode({
      rawBarcode: '   ',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef
    })

    expect(outcome.status).toBe('INVALID')
    expect(findByBarcode).not.toHaveBeenCalled()
    expect(addProductToCart).not.toHaveBeenCalled()
  })

  it('FOUND agrega el producto al carrito', async () => {
    const { addProductToCart, dedupRef } = baseDeps()
    const findByBarcode = jest.fn().mockResolvedValue(makeResult())

    const outcome = await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef
    })

    expect(outcome.status).toBe('FOUND')
    expect(addProductToCart).toHaveBeenCalledTimes(1)
    expect(outcome.product?.pId).toBe('p1')
  })

  it('NOT_FOUND no agrega al carrito y propaga el estado', async () => {
    const { addProductToCart, dedupRef } = baseDeps()
    const findByBarcode = jest.fn().mockResolvedValue(
      makeResult({ success: false, status: 'NOT_FOUND', data: null, message: 'no existe' })
    )

    const outcome = await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef
    })

    expect(outcome.status).toBe('NOT_FOUND')
    expect(addProductToCart).not.toHaveBeenCalled()
  })

  it('DUPLICATE_EVENT: dos lecturas del MISMO código dentro de la ventana solo agregan una vez', async () => {
    const { addProductToCart, dedupRef } = baseDeps()
    const findByBarcode = jest.fn().mockResolvedValue(makeResult())
    let t = 1000
    const now = () => t

    const first = await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef,
      now
    })
    // Segundo evento 100ms después (dentro de la ventana de 800ms).
    t += 100
    const second = await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef,
      now
    })

    expect(first.status).toBe('FOUND')
    expect(second.status).toBe('DUPLICATE_EVENT')
    expect(findByBarcode).toHaveBeenCalledTimes(1)
    expect(addProductToCart).toHaveBeenCalledTimes(1)
  })

  it('escaneo intencional repetido (fuera de la ventana) sí agrega otra unidad', async () => {
    const { addProductToCart, dedupRef } = baseDeps()
    const findByBarcode = jest.fn().mockResolvedValue(makeResult())
    let t = 1000
    const now = () => t

    await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef,
      now
    })
    // Pasada la ventana de dedup: nueva intención de compra.
    t += BARCODE_DEDUP_WINDOW_MS + 50
    const second = await processBarcode({
      rawBarcode: '7700000000007',
      normalize: normalizeBarcode,
      findByBarcode,
      addProductToCart,
      dedupRef,
      now
    })

    expect(second.status).toBe('FOUND')
    expect(findByBarcode).toHaveBeenCalledTimes(2)
    expect(addProductToCart).toHaveBeenCalledTimes(2)
  })
})
