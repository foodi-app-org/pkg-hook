/**
 *
 * @param array
 * @returns filtered and sorted array by date
 */
type ItemWithCreatedAt = { createdAt: string | number | Date; [key: string]: any };

/**
 *
 * @param array
 * @returns filtered and sorted array by date
 */
export function filterAndSortByDate(array: ItemWithCreatedAt[] = []): ItemWithCreatedAt[] {
  if (!Array.isArray(array) || !array.length) return [];

  const currentDate = new Date();
  const sevenDaysAgo = currentDate.getTime() - 7 * 24 * 60 * 60 * 1000;

  const filteredAndSorted = array.map(item => {
    const createdAtDate = new Date(item.createdAt);
    const isNew = createdAtDate.getTime() > sevenDaysAgo;
    return { ...item, isNew };
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return filteredAndSorted;
}
