export function convertToIntegerOrFloat (numberString) {
  if (!numberString) return 0

  // Convierte a número (entero o flotante)
  const numericValue = parseFloat(numberString)

  return isNaN(numericValue) ? 0 : numericValue // Maneja valores no numéricos como 0
}

/**
   * Filter products by carProId.
   * @param {Array} products - Array of products to filter.
   * @param {Array} carProIds - Array of carProId to filter by.
   * @returns {Array} - Filtered array of products or all products if no matches found.
   */
export function filterProductsByCarProId (products, carProIds) {
  if (!Array.isArray(products)) {
    return []
  }

  if (!Array.isArray(carProIds) || carProIds.length === 0) {
    return products
  }

  return products.filter(product => carProIds.includes(product.carProId))
}
