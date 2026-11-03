import type { ApolloCache } from '@apollo/client'
import type { Product } from 'typesdefs'

/**
 * Cantidad de stock consumida por una venta, agrupada por identificador.
 * `products` mapea pId -> unidades vendidas; `extras` mapea exPid -> unidades.
 */
export interface StockConsumption {
  products: Map<string, number>
  extras: Map<string, number>
}

/**
 * Calcula cuánto stock consumió la venta para cada producto y cada complemento
 * (extra) a partir del carrito. Solo cuenta cantidades positivas.
 *
 * - Producto: `ProQuantity` unidades por `pId`.
 * - Extra: `quantity` unidades por `exPid`. Un mismo extra en varias líneas del
 *   carrito se acumula.
 *
 * El consumo se calcula aquí (no se filtra por manageStock) porque el ajuste de
 * caché decide por item si descuenta o no según su propio `manageStock`.
 *
 * @param cartProducts Productos del carrito (data.PRODUCT del reducer).
 * @returns Mapas de consumo por pId y exPid.
 */
export const computeStockConsumption = (
  cartProducts: Product[] | undefined | null
): StockConsumption => {
  const products = new Map<string, number>()
  const extras = new Map<string, number>()

  if (!Array.isArray(cartProducts)) {
    return { products, extras }
  }

  for (const item of cartProducts) {
    const pId = item?.pId
    const quantity = Number(item?.ProQuantity)
    if (pId && Number.isFinite(quantity) && quantity > 0) {
      products.set(pId, (products.get(pId) ?? 0) + quantity)
    }

    const dataExtra: Array<{ exPid?: string; quantity?: number }> = Array.isArray(
      (item as any)?.dataExtra
    )
      ? (item as any).dataExtra
      : []

    for (const extra of dataExtra) {
      const exPid = extra?.exPid
      const extraQuantity = Number(extra?.quantity)
      if (exPid && Number.isFinite(extraQuantity) && extraQuantity > 0) {
        extras.set(exPid, (extras.get(exPid) ?? 0) + extraQuantity)
      }
    }
  }

  return { products, extras }
}

/**
 * Resta `consumed` al stock actual sin bajar de 0. Si el stock de origen no es
 * un número válido, se deja intacto (null/undefined => no se toca).
 *
 * @param currentStock Stock actual del item en caché.
 * @param consumed Unidades vendidas.
 * @returns Nuevo stock, nunca negativo, o el valor original si no es numérico.
 */
const subtractStock = (currentStock: unknown, consumed: number): unknown => {
  const stock = Number(currentStock)
  if (!Number.isFinite(stock)) {
    return currentStock
  }
  return Math.max(0, stock - consumed)
}

/**
 * Devuelve una copia del array de productos con el `stock` descontado para los
 * productos vendidos que manejan inventario (`manageStock === true`). Los demás
 * se devuelven sin cambios. Si no hubo cambios, devuelve el array original para
 * evitar renders innecesarios.
 *
 * @param list Array de productos tal como vive en caché.
 * @param consumption Consumo de stock calculado desde el carrito.
 * @returns Nuevo array con stock descontado, o el original si no hubo cambios.
 */
const applyProductStock = (
  list: any[],
  consumption: StockConsumption
): any[] => {
  if (!Array.isArray(list) || list.length === 0) return list
  let changed = false

  const next = list.map((product) => {
    // Si el item fuera una Reference normalizada (__ref) no podríamos leer sus
    // campos aquí; se deja intacto. Hoy ProductFood no se normaliza, pero esto
    // evita corromper la caché si en el futuro se define keyFields.
    if (!product || product.__ref) {
      return product
    }
    const pId = product?.pId
    const consumed = pId ? consumption.products.get(pId) : undefined
    if (!consumed || !product?.manageStock) {
      return product
    }
    const newStock = subtractStock(product?.stock, consumed)
    if (newStock === product?.stock) {
      return product
    }
    changed = true
    return { ...product, stock: newStock }
  })

  return changed ? next : list
}

/**
 * Igual que applyProductStock pero para complementos (extras), descontando por
 * `exPid` los que manejan inventario.
 *
 * @param list Array de extras tal como vive en caché.
 * @param consumption Consumo de stock calculado desde el carrito.
 * @returns Nuevo array con stock descontado, o el original si no hubo cambios.
 */
const applyExtraStock = (
  list: any[],
  consumption: StockConsumption
): any[] => {
  if (!Array.isArray(list) || list.length === 0) return list
  let changed = false

  const next = list.map((extra) => {
    if (!extra || extra.__ref) {
      return extra
    }
    const exPid = extra?.exPid
    const consumed = exPid ? consumption.extras.get(exPid) : undefined
    if (!consumed || !extra?.manageStock) {
      return extra
    }
    const newStock = subtractStock(extra?.stock, consumed)
    if (newStock === extra?.stock) {
      return extra
    }
    changed = true
    return { ...extra, stock: newStock }
  })

  return changed ? next : list
}

/**
 * Actualiza el stock en la caché de Apollo tras una venta exitosa.
 *
 * Los productos (`ProductFood`) y extras (`ExtProductFood`) no tienen `id`, por
 * lo que Apollo no los normaliza: viven embebidos dentro de los campos raíz de
 * cada query. Por eso, en lugar de `cache.identify` + modify por entidad,
 * recorremos los campos raíz afectados y reescribimos sus listas con el stock
 * descontado:
 *   - `productFoodsAll` -> objeto { data: ProductFood[], ... }
 *   - `getCatProductsWithProduct` -> { catProductsWithProduct: [{ productFoodsAll: ProductFood[] }] }
 *   - `ExtProductFoodsAll` -> ExtProductFood[]
 *
 * `cache.modify` se aplica a todas las entradas de cada campo (todas sus
 * combinaciones de argumentos/paginación), así que la vista del POS refleja el
 * nuevo inventario sin re-fetch. Solo se descuenta a items con
 * `manageStock === true`; el resto queda igual.
 *
 * @param cache Caché de Apollo (desde update() de la mutación).
 * @param cartProducts Productos del carrito que se acaban de vender.
 */
export const updateStockCacheAfterSale = (
  cache: ApolloCache<any>,
  cartProducts: Product[] | undefined | null
): void => {
  const consumption = computeStockConsumption(cartProducts)

  if (consumption.products.size === 0 && consumption.extras.size === 0) {
    return
  }

  cache.modify({
    fields: {
      // Lista principal de productos del POS.
      productFoodsAll(existing: any) {
        if (consumption.products.size === 0) return existing
        // El campo puede ser el objeto { data, pagination, ... } o, en algunas
        // versiones, directamente el array. Soportamos ambos.
        if (Array.isArray(existing)) {
          return applyProductStock(existing, consumption)
        }
        if (existing && Array.isArray(existing.data)) {
          const data = applyProductStock(existing.data, consumption)
          return data === existing.data ? existing : { ...existing, data }
        }
        return existing
      },
      // Productos agrupados por categoría (vista por categorías del POS).
      getCatProductsWithProduct(existing: any) {
        if (consumption.products.size === 0) return existing
        const categories = existing?.catProductsWithProduct
        if (!Array.isArray(categories)) return existing

        let changed = false
        const nextCategories = categories.map((cat: any) => {
          const nextProducts = applyProductStock(cat?.productFoodsAll, consumption)
          if (nextProducts === cat?.productFoodsAll) return cat
          changed = true
          return { ...cat, productFoodsAll: nextProducts }
        })

        return changed
          ? { ...existing, catProductsWithProduct: nextCategories }
          : existing
      },
      // Complementos (extras) por producto.
      ExtProductFoodsAll(existing: any) {
        if (consumption.extras.size === 0) return existing
        return applyExtraStock(existing, consumption)
      }
    }
  })
}
