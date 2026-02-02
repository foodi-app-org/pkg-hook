import { Product } from 'typesdefs'

/**
 * Updates category and products data with a new product.
 * @param {object} dataOld - The old data containing category and product information.
 * @param {string} carProId - The ID of the product to update.
 * @returns {object} Updated data with the new product added, or the original data if the product was not found.
 */
export function getCatProductsWithProduct (dataOld = {}, carProId = '') {
  try {
    if (!carProId || !dataOld) return dataOld
    // Make a copy of the old data to avoid modifying the original object directly
    const copyDataOld = { ...dataOld }

    // Get the category and products data from the old data or use an empty array if it's undefined
    const catProductsWithProduct = copyDataOld?.catProductsWithProduct || []

    // Find the index of the product to update
    const indexToUpdate = catProductsWithProduct?.findIndex((product: Product) => {return product?.carProId === carProId})

    if (indexToUpdate !== -1) {
      // Create a new product
      const newProduct = {
        __typename: 'ProductFood',
        carProId
      }

      // Update the productFoodsAll for the specified product
      const newData = catProductsWithProduct?.map((catProduct) => {
        if (catProduct?.carProId === carProId) {
          const newProductFoodsAll = [...catProduct?.productFoodsAll, newProduct]
          return {
            ...catProduct,
            productFoodsAll: newProductFoodsAll
          }
        }
        return { ...catProduct }
      })

      // Return the updated data
      return {
        catProductsWithProduct: newData,
        totalCount: copyDataOld.totalCount
      }
    }

    // Return the original data if the product was not found
    return copyDataOld
  } catch (error) {
    console.error('An error occurred while updating catProductsWithProduct:', error)
    // Return the original data in case of an error
    return dataOld
  }
}
