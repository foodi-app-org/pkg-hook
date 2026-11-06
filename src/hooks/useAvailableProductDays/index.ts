import { useLazyQuery } from '@apollo/client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  type AvailabilitySummary,
  type AvailableProductRecord,
  buildAvailabilitySummary
} from './helpers'
import { GET_AVAILABLE_PRODUCT_DAYS } from './queries'

export interface UseAvailableProductDaysParams {
  /**
   * Availability records already loaded by a parent query
   * (`getAllAvailableProduct` / `product_availables`). When provided the hook
   * works fully offline (no extra request).
   */
  records?: AvailableProductRecord[] | null
  /**
   * Product id. When provided (and `records` is not), the hook can fetch the
   * availability on demand via `refetch()` or automatically when `autoFetch`.
   */
  pId?: string | null
  /** Fetch automatically when a `pId` is given and no `records` were passed. */
  autoFetch?: boolean
}

export interface UseAvailableProductDaysResult extends AvailabilitySummary {
  loading: boolean
  error?: Error
  /** Imperatively (re)load availability for the current `pId`. */
  refetch: () => Promise<AvailableProductRecord[]>
}

/**
 * Reusable hook that turns raw availability records into a UI-friendly
 * summary (days with time ranges, selected codes, and an "available today"
 * flag). It can also fetch the data by `pId` when needed.
 *
 * Scenarios covered:
 *  - `records` passed inline       -> computed instantly, no request.
 *  - `pId` + autoFetch             -> loads data once on mount.
 *  - `pId` + manual refetch()      -> loads on demand.
 *  - no data                       -> treated as "available all week".
 * @param {UseAvailableProductDaysParams} [params] - Records and/or pId config.
 * @returns {UseAvailableProductDaysResult} Availability summary plus fetch state.
 */
export const useAvailableProductDays = (
  params: UseAvailableProductDaysParams = {}
): UseAvailableProductDaysResult => {
  const { records, pId, autoFetch = false } = params

  const [fetchedRecords, setFetchedRecords] = useState<AvailableProductRecord[] | null>(null)

  const [runQuery, { loading, error }] = useLazyQuery(GET_AVAILABLE_PRODUCT_DAYS, {
    fetchPolicy: 'cache-and-network'
  })

  const refetch = useCallback(async (): Promise<AvailableProductRecord[]> => {
    if (!pId) {
      return []
    }
    const response = await runQuery({ variables: { pId } })
    const data: AvailableProductRecord[] =
      response?.data?.getAllAvailableProduct ?? []
    setFetchedRecords(data)
    return data
  }, [pId, runQuery])

  useEffect(() => {
    // Only auto-fetch when we don't already have inline records.
    if (autoFetch && pId && !Array.isArray(records)) {
      void refetch()
    }
  }, [autoFetch, pId, records, refetch])

  // Inline records always win; otherwise fall back to fetched ones.
  const effectiveRecords = Array.isArray(records) ? records : fetchedRecords

  const summary = useMemo(
    () => buildAvailabilitySummary(effectiveRecords),
    [effectiveRecords]
  )

  return {
    ...summary,
    loading,
    error: error as Error | undefined,
    refetch
  }
}

export * from './helpers'
export { GET_AVAILABLE_PRODUCT_DAYS } from './queries'
