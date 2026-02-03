import type { Product } from 'typesdefs'

interface ProductFood extends Product {
  __typename: string
  carProId: string
}

interface CatProduct {
  carProId: string
  productFoodsAll: ProductFood[]
  [key: string]: any
}

interface CatProductsData {
  catProductsWithProduct: CatProduct[]
  totalCount: number
  [key: string]: any
}

/**
 * Updates category and products data with a new product.
 * @param dataOld - The old data containing category and product information.
 * @param carProId - The ID of the product to update.
 * @returns Updated data with the new product added, or the original data if the product was not found.
 */
export function getCatProductsWithProduct(
  dataOld?: CatProductsData,
  carProId: string = ''
): CatProductsData {
  const safeDataOld: CatProductsData = dataOld ?? { catProductsWithProduct: [], totalCount: 0 }
  try {
    if (!carProId || !safeDataOld) return safeDataOld
    // Make a copy of the old data to avoid modifying the original object directly
    const copyDataOld: CatProductsData = {
      ...dataOld,
      catProductsWithProduct: dataOld?.catProductsWithProduct ?? [],
      totalCount: dataOld?.totalCount ?? 0
    }

    // Get the category and products data from the old data or use an empty array if it's undefined
    const catProductsWithProduct = copyDataOld.catProductsWithProduct || []

    // Find the index of the product to update
    const indexToUpdate = catProductsWithProduct.findIndex((product: CatProduct) => product.carProId === carProId)

    if (indexToUpdate !== -1) {
      // Create a new product (fill with default or placeholder values as needed)
      const newProduct: ProductFood = {
        __typename: 'ProductFood',
        carProId,
        pId: '', // Provide appropriate default or actual values
        stock: 0,
        manageStock: false,
        idStore: '',
        pName: '', // Default or actual value
        ProPrice: 0, // Default or actual value
        createdAt: '', // Default or actual value (e.g., new Date().toISOString())
        updatedAt: '', // Default or actual value (e.g., new Date().toISOString())
        pState: 1, // Add a default or actual value for pState
        // Add any other required Product fields here
      }

      // Update the productFoodsAll for the specified product
      const newData = catProductsWithProduct.map((catProduct: CatProduct) => {
        if (catProduct.carProId === carProId) {
          const newProductFoodsAll = [
            ...(catProduct.productFoodsAll || []),
            newProduct
          ]
          return {
            ...catProduct,
            productFoodsAll: newProductFoodsAll
          }
        }
        return { ...catProduct }
      })

      // Return the updated data
      return {
        ...copyDataOld,
        catProductsWithProduct: newData,
        totalCount: copyDataOld.totalCount
      }
    }

    // Return the original data if the product was not found
    return copyDataOld
  } catch (error) {
    console.error('An error occurred while updating catProductsWithProduct:', error)
    // Return the original data in case of an error
    return safeDataOld
  }
}
