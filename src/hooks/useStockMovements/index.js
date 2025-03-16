import { useState, useEffect } from 'react'
import { useQuery, gql } from '@apollo/client'
import { fillMissingDates } from './helpers'

const GET_STOCK_MOVEMENTS = gql`
  query {
    getStockMovementsByDay {
      date
      total_in
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
      const formattedData = data.getStockMovementsByDay.map(entry => ({
        date: new Date(entry.date).toLocaleDateString(),
        TotalIn: entry.total_in,
        TotalOut: entry.total_out
      }))
      setChartData(formattedData)
    }
  }, [data])

  return [fillMissingDates(chartData), { loading, error }]
}
