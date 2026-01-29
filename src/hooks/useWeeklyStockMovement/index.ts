import { gql, useQuery } from '@apollo/client'
import { fillLast7Weeks } from './helpers' // Asegúrate de importar el helper

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

/**
 * Custom hook to fetch and format weekly stock movement data.
 * @returns {Object} - { data, loading, error, formattedData }
 */
export const useWeeklyStockMovement = () => {
  const { data, loading, error } = useQuery(GET_WEEKLY_STOCK_MOVEMENT)

  // Transform data and fill missing weeks
  const rawData = data?.getStockMovementWeeklyComparison || []
  const formattedData = fillLast7Weeks(
    rawData.map(item => ({
      ...item,
      percentageChange: formatPercentageChange(item.percentageChange)
    }))
  )

  return [formattedData, { loading, error }]
}

/**
 * Ensures percentageChange is a valid string percentage, clamping between -100% and 100%.
 *
 * @param {string | null} percentageChange - Raw percentage change value.
 * @returns {string} - Formatted and clamped percentage change.
 */
const formatPercentageChange = (percentageChange) => {
  if (percentageChange === null) return 'N/A'

  // Convertir a número
  let parsedValue = parseFloat(percentageChange)

  // Clampear entre -100% y 100%
  if (isNaN(parsedValue)) return 'N/A'
  parsedValue = Math.max(-100, Math.min(100, parsedValue))

  return `${parsedValue.toFixed(1)}`
}
