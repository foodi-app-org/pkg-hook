/**
 * Filter products by carProId.
 * @param {Array} products - Array of products to filter.
 * @param {Array} carProIds - Array of carProId to filter by.
 * @returns {Array} - Filtered array of products or all products if no matches found.
 */
export function filterProductsByCarProId(products: any[], carProIds: (string | number)[]) {
  if (!Array.isArray(products)) {
    return []
  }

  if (!Array.isArray(carProIds) || carProIds.length === 0) {
    return products
  }

  return products.filter(product => {return carProIds.includes(product.carProId)})
}