export function filterAndSortByDate (array = []) {
  const isError = !Array.isArray(array) || !array.length
  try {
    if (isError) return []

    const currentDate = new Date()
    const sevenDaysAgo = currentDate.getTime() - 7 * 24 * 60 * 60 * 1000 // Calculating timestamp for 7 days ago

    const filteredAndSorted = array.map(item => {
      const createdAtDate = new Date(item.createdAt)
      const isNew = createdAtDate.getTime() >= sevenDaysAgo
      return { ...item, isNew }
    }).sort((a, b) => {
      // Ordenar primero por 'open' en 1 y luego por 'createdAt'
      if (a.open !== b.open) {
        return b.open - a.open // Orden descendente para 'open' en 1 primero
      } else {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateA - dateB
      }
    })

    return filteredAndSorted
  } catch (error) {
    if (isError) return []
    if (Array.isArray(array)) return array
  }
}
