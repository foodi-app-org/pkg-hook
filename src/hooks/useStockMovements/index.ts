import { useQuery, gql } from '@apollo/client'
import { useState, useEffect } from 'react'

import { fillMissingDates } from './helpers'

const GET_STOCK_MOVEMENTS = gql`
  query {
    getStockMovementsByDay {
      date
      total_in,
      total_adjustment
      total_out
    }
  }
`

/**
 * Custom hook to fetch stock movements data for visualization.
 * @returns {Object} { data, loading, error }
 */
export const useStockMovements = () => {
  const { data, loading, error } = useQuery(GET_STOCK_MOVEMENTS)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    if (data && data.getStockMovementsByDay) {
      // Transform data to be compatible with Recharts
      const formattedData = data.getStockMovementsByDay.map(entry => {return {
        date: entry.date,
        TotalIn: entry.total_in ?? 0,
        TotalOut: entry.total_out ?? 0,
        TotalAdjustment: entry.total_adjustment ?? 0
      }})
      setChartData(formattedData)
    }
  }, [data])

  return [fillMissingDates(chartData), { loading, error }]
}
