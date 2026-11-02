interface StockMovementData {
  date: string;
  TotalIn: number;
  TotalOut: number;
  TotalAdjustment: number;
}

/**
 * Formats a Date into a "YYYY-MM-DD" key using its LOCAL calendar date.
 *
 * Using `toISOString()` here would convert to UTC and, for negative-offset
 * timezones (e.g. America/Bogota, UTC-5), shift the evening of day N to day
 * N+1. That produced a phantom "tomorrow" bucket in the chart. Formatting with
 * local components keeps the key aligned with `Date.setDate`, which also
 * operates in local time.
 *
 * @param {Date} date - The date to format.
 * @returns {string} Local date in "YYYY-MM-DD" form.
 */
const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fillMissingDates = (data: StockMovementData[], days: number = 7): StockMovementData[] => {
  const today = new Date()
  const filledData: StockMovementData[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)

    const formattedDate = toLocalDateKey(date) // "YYYY-MM-DD" (local)
    const existingData = data.find((item: StockMovementData) => {return item.date === formattedDate})

    filledData.push(existingData || { date: formattedDate, TotalIn: 0, TotalOut: 0, TotalAdjustment: 0 })
  }

  return filledData
}
