import { gql, useQuery } from '@apollo/client'

import { fillLast7Weeks, WeeklyStockMovement } from './helpers'

const GET_WEEKLY_STOCK_MOVEMENT = gql`
  query GetStockMovementPercentageChange {
    getStockMovementWeeklyComparison {
      weekStart
      totalOut
      prevTotalOut
      percentageChange
    }
  }
`

type PercentageChange = string | null

export const useWeeklyStockMovement = (): [
  WeeklyStockMovement[],
  { loading: boolean; error?: Error }
] => {
  const { data, loading, error } = useQuery(GET_WEEKLY_STOCK_MOVEMENT)

  // Transform data and fill missing weeks
  const rawData: WeeklyStockMovement[] = data?.getStockMovementWeeklyComparison || []
  const formattedData = fillLast7Weeks(
    rawData.map((item: WeeklyStockMovement) => ({
      ...item,
      percentageChange: formatPercentageChange(item.percentageChange)
    }))
  )

  return [formattedData, { loading, error }]
}

/**
 * Ensures percentageChange is a valid string percentage, clamping between -100% and 100%.
 *
 * @param percentageChange Raw percentage change value.
 * @returns Formatted and clamped percentage change.
 */
const formatPercentageChange = (percentageChange: PercentageChange): string => {
  if (percentageChange === null) return 'N/A'

  // Convert to number
  let parsedValue = Number.parseFloat(percentageChange)

  // Clamp between -100% and 100%
  if (Number.isNaN(parsedValue)) return 'N/A'
  parsedValue = Math.max(-100, Math.min(100, parsedValue))

  return `${parsedValue.toFixed(1)}`
}
