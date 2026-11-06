import type { Product } from 'typesdefs'

/**
 * Normaliza un código de barras escaneado/ingresado: quita espacios y cualquier
 * carácter no numérico (los lectores suelen añadir un Enter/tab final, y a veces
 * ceros con formato). Devuelve el string listo para comparar.
 */
export const normalizeBarcode = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return ''
  return `${raw}`.trim()
}

/**
 * Busca un producto en la lista en memoria por su código de barras (`ProBarCode`).
 * La comparación se hace sobre el valor normalizado para tolerar espacios y el
 * salto de línea que agregan los lectores de código de barras.
 *
 * @returns el producto que coincide, o `null` si no hay match.
 */
export const findProductByBarcode = (
  barcode: string | number | null | undefined,
  productsFood: Product[] = []
): Product | null => {
  const target = normalizeBarcode(barcode)
  if (!target) return null

  const match = productsFood.find((item: any) => {
    return normalizeBarcode(item?.ProBarCode) === target
  })

  return (match as Product) ?? null
}
