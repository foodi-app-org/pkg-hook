interface StockMovementData {
  date: string;
  TotalIn: number;
  TotalOut: number;
  TotalAdjustment: number;
}

export const fillMissingDates = (data: StockMovementData[], days: number = 7): StockMovementData[] => {
  const today = new Date()
  const filledData: StockMovementData[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)

    const formattedDate = date.toISOString().split('T')[0] // "YYYY-MM-DD"
    const existingData = data.find((item: StockMovementData) => {return item.date === formattedDate})

    filledData.push(existingData || { date: formattedDate, TotalIn: 0, TotalOut: 0, TotalAdjustment: 0 })
  }

  return filledData
}
