import { useQuery, gql } from '@apollo/client'
import { useState, useEffect } from 'react'

import { fillMissingDates } from './helpers'

type StockMovementData = {
  date: string
  total_in?: number
  total_out?: number
  total_adjustment?: number
}

type ChartData = {
  date: string
  TotalIn: number
  TotalOut: number
  TotalAdjustment: number
}

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
 * @returns {[ChartData[], { loading: boolean, error: any }]}
 */
export const useStockMovements = (): [ChartData[], { loading: boolean, error: undefined }] => {
  const { data, loading } = useQuery(GET_STOCK_MOVEMENTS)
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    if (data?.getStockMovementsByDay) {
      // Transform data to be compatible with Recharts
      const formattedData = data.getStockMovementsByDay.map((entry: StockMovementData) => ({
        date: entry.date,
        TotalIn: entry.total_in ?? 0,
        TotalOut: entry.total_out ?? 0,
        TotalAdjustment: entry.total_adjustment ?? 0
      }))
      setChartData(formattedData)
    }
  }, [data])

  return [fillMissingDates(chartData), { loading, error: undefined }]
}
