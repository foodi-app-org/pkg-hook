import { ItemWithCreatedAt } from './index';

/**
 *
 * @param items
 * @returns {Array} Items filtrados y ordenados por fecha de creación (más recientes primero)
 */
export function filterAndSortByDate(items: ItemWithCreatedAt[]): ItemWithCreatedAt[] {
  return items.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}