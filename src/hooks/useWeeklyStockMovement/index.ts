import { gql, useQuery } from '@apollo/client'
import { useMemo } from 'react'

import { normalizeWeeklyStock } from './helpers'
import type { WeeklyStockMovement, WeeklyStockWire } from './helpers'
export type { WeeklyStockMovement, WeeklyComparisonStatus } from './helpers'

export const GET_WEEKLY_STOCK_MOVEMENT = gql`
  query GetStockMovementPercentageChange {
    getStockMovementWeeklyComparison {
      weekStart
      weekEnd
      totalOut
      prevTotalOut
      percentageChange
      comparisonStatus
      isCurrent
      isPartial
      historyPartial
    }
  }
`

export const useWeeklyStockMovement = () => {
  const { data, loading, error, refetch } = useQuery<{
    getStockMovementWeeklyComparison: WeeklyStockWire[]
  }>(GET_WEEKLY_STOCK_MOVEMENT, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true
  })

  const normalized = useMemo<{ rows: WeeklyStockMovement[]; error?: Error }>(() => {
    if (!data) return { rows: [] }
    try {
      return { rows: normalizeWeeklyStock(data.getStockMovementWeeklyComparison) }
    } catch (cause) {
      return { rows: [], error: cause instanceof Error ? cause : new Error('Invalid weekly stock response') }
    }
  }, [data])

  // Preserve the public two-element tuple; refetch is an additive capability.
  const result: [WeeklyStockMovement[], { loading: boolean; error?: Error; refetch: typeof refetch }] = [
    normalized.rows,
    { loading, error: error ?? normalized.error, refetch }
  ]
  return result
}
