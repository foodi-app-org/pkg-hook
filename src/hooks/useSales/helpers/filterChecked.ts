import { Product } from 'typesdefs'

/**
 * Filter objects with checked property equal to true.
 * @param {Array} products - Array of objects.
 * @returns {Array} - Array of objects with checked property equal to true.
 */
export function filterChecked(products: Product[]) {
    if (!Array.isArray(products)) {
        return []
    }

    return products.filter(product => { return product?.checked === true })?.map(product => { return product?.carProId })
}