import { jaccardSimilarity } from './helpers'

/**
   * Get categories that contain products with names similar to the given product name.
   * Uses the Jaccard similarity coefficient for string comparison.
   * @param {Array} data - The array of categories with product information.
   * @param {string} productName - The name of the product to search for.
   * @param {number} similarityThreshold - The minimum similarity threshold for products (0.0 to 1.0).
   * @returns {Array} - An array of categories containing similar products.
   */
export const getCategoriesWithProduct = (
  data = [],
  productName = '',
  similarityThreshold = 0.0) => {
  // Validate input data
  if (!data || !Array.isArray(data)) {
    return data || []
  }

  if (typeof productName !== 'string' || productName.trim() === '') {
    return data
  }

  // Convert product name to lowercase for case-insensitive comparison
  const productNameLower = productName.toLowerCase()

  // Use a Set to store unique product names for better performance
  const uniqueProductNames = new Set()

  // Store unique product names in the Set
  data.forEach(category => {
    if (category?.productFoodsAll && Array.isArray(category.productFoodsAll)) {
      category.productFoodsAll.forEach(product => {
        const productLower = product.pName.toLowerCase()
        uniqueProductNames.add(productLower)
      })
    }
  })

  // Filter categories that contain products with names similar to the given product name
  const matchingCategories = data.filter(category => {
    if (category?.productFoodsAll && Array.isArray(category.productFoodsAll)) {
      const products = category.productFoodsAll.some(product => {
        const productLower = product?.pName?.toLowerCase()
        return jaccardSimilarity(productNameLower, productLower) >= similarityThreshold
      })
      return products
    }
    return false
  })

  // Find similar products in each matching category
  const findProduct = matchingCategories?.map(categories => {
    const similarProducts = categories.productFoodsAll.filter(product => {
      const productLower = product?.pName?.toLowerCase()
      return productLower.includes(productNameLower)
    })
    return similarProducts.length > 0 ? { ...categories, productFoodsAll: similarProducts } : null
  }).filter(Boolean)

  return findProduct
}
