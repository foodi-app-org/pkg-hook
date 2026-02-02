import { ItemWithCreatedAt } from './index';

export function filterAndSortByDate(items: ItemWithCreatedAt[]): ItemWithCreatedAt[] {
  return items.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}