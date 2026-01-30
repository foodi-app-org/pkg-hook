/**
 *
 * @param array
 */
export function filterAndSortByDate (array = []) {
  const isError = !Array.isArray(array) || !array.length
  try {
    if (isError) return []

    const currentDate = new Date()
    const sevenDaysAgo = currentDate.getTime() - 7 * 24 * 60 * 60 * 1000

    const filteredAndSorted = array.map(item => {
      const createdAtDate = new Date(item.createdAt)
      const isNew = (createdAtDate.getTime() <= sevenDaysAgo)
      return { ...item, isNew }
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return filteredAndSorted
  } catch (error) {
    if (isError) return []
    if (Array.isArray(array)) return array
  }
}
