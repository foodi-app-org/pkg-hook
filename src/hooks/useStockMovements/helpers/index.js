export const fillMissingDates = (data, days = 7) => {
  const today = new Date()
  const filledData = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)

    const formattedDate = date.toLocaleDateString('es-ES') // "dd/mm/yyyy"
    const existingData = data.find(item => item.date === formattedDate)

    filledData.push(existingData || { date: formattedDate, TotalIn: 0, TotalOut: 0 })
  }

  return filledData
}
