/**
 * Busca un objeto dentro de un conjunto de columnas por su código de referencia.
 * @param {Object} data - El objeto que contiene las columnas.
 * @param {string} pCodeRef - El código de referencia a buscar.
 * @returns {Object|null} - El objeto encontrado o null si no se encuentra.
 */
export function findOrderByCodeRef (data, pCodeRef) {
  if (!data || typeof data !== 'object') {
    throw new Error('El parámetro "data" debe ser un objeto no nulo.')
  }

  if (typeof pCodeRef !== 'string') {
    throw new Error('El parámetro "pCodeRef" debe ser una cadena de texto.')
  }

  // Iterar sobre cada columna en el objeto data
  for (const columnKey in data) {
    if (Object.hasOwnProperty.call(data, columnKey)) {
      const column = data[columnKey]
      // Verificar si la columna es un array
      if (Array.isArray(column)) {
        // Buscar el objeto por pCodeRef dentro de la columna actual
        const foundOrder = column.find(
          (order) => {return order && order.pCodeRef === pCodeRef}
        )
        // Si se encuentra el objeto, devolverlo
        if (foundOrder) {
          return foundOrder
        }
      }
    }
  }
  // Si no se encuentra el objeto en ninguna columna, devolver null
  return null
}

export const isDateInRange = (dateString) => {
  const currentDate = new Date()
  const todayStart = new Date(currentDate.setHours(0, 0, 0, 0))
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const date = new Date(dateString)
  return date >= todayStart && date < tomorrowStart
}
