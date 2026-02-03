import { CatProductWithProduct } from '../../useCatWithProduct/types'

/**
 * Filter objects with checked property equal to true.
 * @param {Array} products - Array of objects.
 * @param categories
 * @returns {Array} - Array of objects with checked property equal to true.
 */
export function filterChecked(categories: CatProductWithProduct[]): string[] {
    return categories.filter(cat => cat.checked).map(cat => cat.carProId)
}