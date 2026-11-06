import { useMutation } from '@apollo/client'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  type AvailableProductRecord,
  DEFAULT_END_TIME,
  DEFAULT_START_TIME
} from '../useAvailableProductDays/helpers'
import { days as weekDays } from '../useSaveAvailableProduct/helpers/index'

import { UPDATE_AVAILABLE_PRODUCTS_DAYS } from './queries'

/** Time range configured for a single weekday. */
export interface DayConfig {
  startTime: string
  endTime: string
}

export interface UseUpdateAvailableProductDaysParams {
  /** Product id whose schedule is edited. */
  pId?: string | null
  /** Store id (sent with each row; backend also derives it from session). */
  idStore?: string | null
  /** Current availability records used to preload the editable state. */
  records?: AvailableProductRecord[] | null
  /** Called after a successful update with the reconciled schedule. */
  onUpdated?: (data: AvailableProductRecord[]) => void
}

export interface UseUpdateAvailableProductDaysResult {
  /** Selected weekday numbers (0 = Sunday ... 6 = Saturday). */
  selectedDays: number[]
  /** Per-day time configuration. */
  dayConfigs: Record<number, DayConfig>
  /** Weekday catalog for the selector ([{ day, name }]). */
  days: typeof weekDays
  /** Whether the update mutation is in flight. */
  loading: boolean
  /** Toggle a weekday on/off, seeding a default range when turned on. */
  handleDaySelection: (day: number) => void
  /** Update the start/end time of a given day. */
  handleChange: (day: number, field: 'startTime' | 'endTime', value: string) => void
  /** Reset the editable state back to the provided records. */
  reset: () => void
  /** Persist the current selection. Returns the mutation response payload. */
  save: () => Promise<{
    success: boolean
    message?: string
    errors?: { message?: string; path?: string[] }[]
    data?: AvailableProductRecord[]
  }>
}

/**
 * Builds the editable state (selected days + time ranges) from raw records.
 * @param {AvailableProductRecord[] | null | undefined} records - Raw records.
 * @returns {{ selectedDays: number[]; dayConfigs: Record<number, DayConfig> }} Editable state.
 */
const buildStateFromRecords = (
  records: AvailableProductRecord[] | null | undefined
): { selectedDays: number[]; dayConfigs: Record<number, DayConfig> } => {
  const selectedDays: number[] = []
  const dayConfigs: Record<number, DayConfig> = {}

  if (Array.isArray(records)) {
    for (const record of records) {
      const day = Number(record?.dayAvailable)
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        continue
      }
      if (!selectedDays.includes(day)) {
        selectedDays.push(day)
      }
      dayConfigs[day] = {
        startTime: record?.startDate ?? DEFAULT_START_TIME,
        endTime: record?.endDate ?? DEFAULT_END_TIME
      }
    }
  }

  return { selectedDays: selectedDays.sort((a, b) => a - b), dayConfigs }
}

/**
 * Hook to UPDATE (synchronize) the weekly availability of a product. It keeps
 * an editable copy of the schedule (selected days + per-day time ranges)
 * preloaded from the current records, and persists it via a single mutation
 * that reconciles the whole set on the backend.
 * @param {UseUpdateAvailableProductDaysParams} [params] - Product and records.
 * @returns {UseUpdateAvailableProductDaysResult} Editable state and actions.
 */
export const useUpdateAvailableProductDays = (
  params: UseUpdateAvailableProductDaysParams = {}
): UseUpdateAvailableProductDaysResult => {
  const { pId, idStore, records, onUpdated } = params

  const initial = useMemo(() => buildStateFromRecords(records), [records])

  const [selectedDays, setSelectedDays] = useState<number[]>(initial.selectedDays)
  const [dayConfigs, setDayConfigs] = useState<Record<number, DayConfig>>(initial.dayConfigs)

  // Keep the editable state in sync when the source records change (e.g. after
  // reopening the modal for a different product).
  useEffect(() => {
    setSelectedDays(initial.selectedDays)
    setDayConfigs(initial.dayConfigs)
  }, [initial])

  const [runUpdate, { loading }] = useMutation(UPDATE_AVAILABLE_PRODUCTS_DAYS)

  const handleDaySelection = useCallback((day: number) => {
    setSelectedDays((previous) => {
      if (previous.includes(day)) {
        return previous.filter((selected) => selected !== day)
      }
      return [...previous, day].sort((a, b) => a - b)
    })

    // Seed a default range the first time a day is enabled.
    setDayConfigs((previous) => {
      if (previous[day]) {
        return previous
      }
      return {
        ...previous,
        [day]: { startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME }
      }
    })
  }, [])

  const handleChange = useCallback(
    (day: number, field: 'startTime' | 'endTime', value: string) => {
      setDayConfigs((previous) => ({
        ...previous,
        [day]: {
          startTime: previous[day]?.startTime ?? DEFAULT_START_TIME,
          endTime: previous[day]?.endTime ?? DEFAULT_END_TIME,
          [field]: value
        }
      }))
    },
    []
  )

  const reset = useCallback(() => {
    setSelectedDays(initial.selectedDays)
    setDayConfigs(initial.dayConfigs)
  }, [initial])

  const save = useCallback(async () => {
    // Build the full desired schedule from the current selection.
    const input = selectedDays.map((day) => ({
      idStore,
      pId,
      dayAvailable: day,
      startDate: dayConfigs[day]?.startTime ?? DEFAULT_START_TIME,
      endDate: dayConfigs[day]?.endTime ?? DEFAULT_END_TIME
    }))

    const response = await runUpdate({
      variables: { pId, input }
    })

    const result = response?.data?.updateAvailableProduct ?? {
      success: false,
      message: 'No response from server'
    }

    if (result?.success) {
      onUpdated?.(result.data ?? [])
    }

    return result
  }, [dayConfigs, idStore, onUpdated, pId, runUpdate, selectedDays])

  return {
    selectedDays,
    dayConfigs,
    days: weekDays,
    loading,
    handleDaySelection,
    handleChange,
    reset,
    save
  }
}

export { UPDATE_AVAILABLE_PRODUCTS_DAYS } from './queries'
