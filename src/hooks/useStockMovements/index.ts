import { useQuery, gql } from '@apollo/client'
import { useState, useEffect } from 'react'

import { DashboardFilterInput } from '../useDashboardSummary'

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
  query GetStockMovementsByDay($filter: DashboardFilterInput) {
    getStockMovementsByDay(filter: $filter) {
      date
      total_in
      total_adjustment
      total_out
    }
  }
`

/**
 * Fetches daily stock movements (IN / OUT / ADJUSTMENT) for visualization.
 *
 * @param {DashboardFilterInput} [filter] - Optional dashboard period/filter.
 *   When provided, the backend restricts movements to the selected range; when
 *   omitted the full history is returned (backward compatible).
 * @returns {[ChartData[], { loading: boolean, error: any, refetch: () => void }]}
 */
export const useStockMovements = (
  filter: DashboardFilterInput = {}
): [ChartData[], { loading: boolean, error: unknown, refetch: () => void }] => {
  const { data, loading, error, refetch } = useQuery(GET_STOCK_MOVEMENTS, {
    variables: { filter },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })
  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    if (data?.getStockMovementsByDay) {
      const formattedData = data.getStockMovementsByDay.map((entry: StockMovementData) => ({
        date: entry.date,
        TotalIn: entry.total_in ?? 0,
        TotalOut: entry.total_out ?? 0,
        TotalAdjustment: entry.total_adjustment ?? 0
      }))
      setChartData(formattedData)
    }
  }, [data])

  return [fillMissingDates(chartData), { loading, error, refetch }]
}
