export const findOrderByCodeRef = (data, pCodeRef) => {
  // Iterar sobre cada columna en el objeto data
  for (const column of Object.values(data)) {
    // Buscar el objeto por pCodeRef dentro de la columna actual
    const foundOrder = column.find(order => order.pCodeRef === pCodeRef)
    // Si se encuentra el objeto, devolverlo
    if (foundOrder) {
      return foundOrder
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
