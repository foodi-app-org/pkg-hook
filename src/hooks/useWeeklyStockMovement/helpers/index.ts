export interface WeeklyStockMovement {
  weekStart: string;
  totalOut: number;
  prevTotalOut: number | null;
  percentageChange: string;
}

export const fillLast7Weeks = (data: WeeklyStockMovement[]): WeeklyStockMovement[] => {
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
  const dataMap = new Map(data.map((item: WeeklyStockMovement) => {return [item.weekStart, item]}))

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
