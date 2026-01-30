/**
 * Fills missing weeks for the last 7 weeks, ensuring continuous data.
 * If a week is missing, it fills it with totalOut: 0 and percentageChange: "N/A".
 *
 * @param {Array} data - Array of weekly stock movement objects.
 * @returns {Array} - Filled data ensuring the last 7 weeks are covered.
 */
export const fillLast7Weeks = (data) => {
  const today = new Date()
  const last7Weeks = []

  // Generar las últimas 7 semanas (cada lunes)
  for (let i = 6; i >= 0; i--) {
    const weekDate = new Date(today)
    weekDate.setDate(today.getDate() - today.getDay() - (i * 7) + 1) // Ajustar para que sea lunes
    const weekStart = weekDate.toISOString().split('T')[0] // Formato YYYY-MM-DD
    last7Weeks.push(weekStart)
  }

  // Mapear los datos existentes para acceso rápido
  const dataMap = new Map(data.map(item => {return [item.weekStart, item]}))

  // Construir la nueva lista asegurando que todas las semanas estén presentes
  return last7Weeks.map(weekStart => {return (
    dataMap.get(weekStart) || {
      weekStart,
      totalOut: 0,
      prevTotalOut: null,
      percentageChange: 'N/A'
    }
  )})
}
