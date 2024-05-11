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

export function removeFunc (state, action, productsFood) {
  const productExist = state?.PRODUCT.find((items) => {
    return items.pId === action.payload.pId
  })
  const OurProduct = productsFood.find((items) => {
    return items.pId === action.payload.pId
  })
  return {
    ...state,
    counter: state.counter - 1,
    totalAmount: state.totalAmount - action.payload.ProPrice,
    PRODUCT:
      action.payload.ProQuantity > 1
        ? state.PRODUCT.map((items) => {
          return items.pId === action.payload.pId
            ? {
                ...items,
                pId: action.payload.pId,
                ProQuantity: items.ProQuantity - 1,
                ProPrice: productExist.ProPrice - OurProduct?.ProPrice
              }
            : items
        })
        : state.PRODUCT.filter((items) => {
          return items.pId !== action.payload.pId
        })
  }
}
