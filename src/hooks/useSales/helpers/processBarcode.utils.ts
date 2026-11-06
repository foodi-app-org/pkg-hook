import type { Product } from 'typesdefs'

/** Estados diferenciados que devuelve la búsqueda por código de barras. */
export type FindByBarcodeStatus = 'FOUND' | 'NOT_FOUND' | 'INVALID' | 'ERROR'

export interface FindProductByBarcodeResult {
  success: boolean
  status: FindByBarcodeStatus
  message: string
  barcode: string
  data: Product | null
}

/** Resultado del controlador central de procesamiento de un código. */
export interface ProcessBarcodeOutcome {
  status: FindByBarcodeStatus | 'DUPLICATE_EVENT'
  /** Código normalizado que se procesó. */
  barcode: string
  /** Producto agregado al carrito (solo cuando status === 'FOUND'). */
  product: Product | null
  /** Mensaje legible para notificación/UX. */
  message: string
}

/**
 * Ventana de deduplicación (ms). Dos detecciones del MISMO código dentro de
 * esta ventana se consideran el mismo evento físico (rebote de Quagga, doble
 * callback, StrictMode) y la segunda se ignora. Pasada la ventana, volver a
 * escanear el mismo código es una intención legítima de sumar otra unidad.
 */
export const BARCODE_DEDUP_WINDOW_MS = 800

export interface DedupRef {
  code: string
  at: number
}

export interface ProcessBarcodeDeps {
  /** Código crudo leído (cámara/USB/imagen/manual). */
  rawBarcode: string | number | null | undefined
  /** Normalizador de código (misma lógica que el backend). */
  normalize: (raw: string | number | null | undefined) => string
  /** Consulta al backend real por código de barras. */
  findByBarcode: (code: string) => Promise<FindProductByBarcodeResult>
  /** Agrega el producto resuelto al carrito (reutiliza el flujo existente). */
  addProductToCart: (product: Product) => void
  /** Ref mutable que guarda la última emisión (code + timestamp). */
  dedupRef: { current: DedupRef }
  /** Ventana de dedup (ms). Por defecto BARCODE_DEDUP_WINDOW_MS. */
  dedupWindowMs?: number
  /** Reloj inyectable (para tests). */
  now?: () => number
}

/**
 * Controlador central de procesamiento de un código de barras. Lo usan TODAS
 * las fuentes (cámara, lector USB/Bluetooth, imagen, entrada manual) para que
 * el flujo de negocio sea único:
 *
 *   normalizar -> deduplicar evento -> consultar backend -> actuar por status.
 *
 * No agrega stock/estado paralelo: cuando el producto existe, lo incorpora al
 * carrito mediante `addProductToCart` (el mismo flujo que `handleAddProduct`,
 * que ya incrementa cantidad si ya está en el carrito y respeta las reglas).
 *
 * Devuelve un `ProcessBarcodeOutcome` para que la UI decida (ofrecer creación
 * en NOT_FOUND, avisar INVALID/ERROR, reproducir sonido en FOUND, etc.).
 *
 * @param deps - Dependencias inyectadas (código crudo, normalizador, consulta
 *   al backend, agregado al carrito, ref de deduplicación, ventana y reloj).
 * @returns El resultado del procesamiento (status, barcode, product, message).
 */
export const processBarcode = async (
  deps: ProcessBarcodeDeps
): Promise<ProcessBarcodeOutcome> => {
  const {
    rawBarcode,
    normalize,
    findByBarcode,
    addProductToCart,
    dedupRef,
    dedupWindowMs = BARCODE_DEDUP_WINDOW_MS,
    now = Date.now
  } = deps

  const barcode = normalize(rawBarcode)

  if (!barcode) {
    return {
      status: 'INVALID',
      barcode: '',
      product: null,
      message: 'Código de barras vacío.'
    }
  }

  // Deduplicación por ventana de tiempo: mismo código + muy reciente => mismo
  // evento físico, no una nueva intención. NO bloquea sumar unidades: pasada la
  // ventana, el mismo código se procesa de nuevo y aumenta la cantidad.
  const currentTime = now()
  const isSameRecent =
    dedupRef.current.code === barcode &&
    currentTime - dedupRef.current.at < dedupWindowMs

  if (isSameRecent) {
    return {
      status: 'DUPLICATE_EVENT',
      barcode,
      product: null,
      message: 'Lectura repetida ignorada.'
    }
  }

  // Marcamos la emisión ANTES de la consulta async para que detecciones en
  // ráfaga (varios callbacks del mismo frame) no disparen consultas paralelas.
  dedupRef.current = { code: barcode, at: currentTime }

  const result = await findByBarcode(barcode)

  if (result.status === 'FOUND' && result.data) {
    addProductToCart(result.data)
    return {
      status: 'FOUND',
      barcode: result.barcode || barcode,
      product: result.data,
      message: result.message || 'Producto agregado al carrito.'
    }
  }

  return {
    status: result.status,
    barcode: result.barcode || barcode,
    product: null,
    message: result.message
  }
}
