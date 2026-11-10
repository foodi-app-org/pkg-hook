
import { useApolloClient, useMutation } from '@apollo/client'
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

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

export interface UpdateAvailableProductDaysResponse {
  success: boolean
  message?: string
  errors?: {
    message?: string
    path?: string[]
  }[]
  data?: AvailableProductRecord[]
}

export interface UseUpdateAvailableProductDaysResult {
  /** Selected weekday numbers (0 = Sunday ... 6 = Saturday). */
  selectedDays: number[]

  /** Per-day time configuration. */
  dayConfigs: Record<number, DayConfig>

  /** Weekday catalog for the selector. */
  days: typeof weekDays

  /** Whether the update mutation is in flight. */
  loading: boolean

  /** Toggle a weekday on/off. */
  handleDaySelection: (day: number) => void

  /** Update the start/end time of a given day. */
  handleChange: (
    day: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => void

  /** Reset the editable state back to the provided records. */
  reset: () => void

  /** Persist the current selection and refresh the Apollo cache. */
  save: () => Promise<UpdateAvailableProductDaysResponse>
}

interface EditableAvailabilityState {
  selectedDays: number[]
  dayConfigs: Record<number, DayConfig>
}

/**
 * Builds the editable state from the availability records.
 * @param records
 */
const buildStateFromRecords = (
  records: AvailableProductRecord[] | null | undefined
): EditableAvailabilityState => {
  const selectedDays: number[] = []
  const dayConfigs: Record<number, DayConfig> = {}

  if (Array.isArray(records)) {
    for (const record of records) {
      const day = Number(record?.dayAvailable)

      if (
        !Number.isInteger(day) ||
        day < 0 ||
        day > 6
      ) {
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

  return {
    selectedDays: selectedDays.sort((a, b) => a - b),
    dayConfigs
  }
}

/**
 * Generates a stable signature for the records.
 *
 * This prevents the editing state from resetting when the parent
 * creates a new array containing exactly the same records.
 * @param records
 */
const getRecordsSignature = (
  records: AvailableProductRecord[] | null | undefined
): string => {
  if (!Array.isArray(records)) {
    return '[]'
  }

  return JSON.stringify(
    records.map((record) => [
      Number(record?.dayAvailable),
      record?.startDate ?? DEFAULT_START_TIME,
      record?.endDate ?? DEFAULT_END_TIME
    ])
  )
}

/**
 * Synchronizes the weekly availability of a product.
 *
 * Responsibilities:
 * - Keeps an editable copy of the weekly schedule.
 * - Updates the schedule through a single backend mutation.
 * - Synchronizes local editable state with the returned records.
 * - Refreshes active Apollo queries after a successful mutation.
 *
 * @param params - Product, store and current availability records.
 */
export const useUpdateAvailableProductDays = (
  params: UseUpdateAvailableProductDaysParams = {}
): UseUpdateAvailableProductDaysResult => {
  const {
    pId,
    idStore,
    records,
    onUpdated
  } = params

  // APOLLO
  const client = useApolloClient()

  const [runUpdate, { loading }] = useMutation(
    UPDATE_AVAILABLE_PRODUCTS_DAYS
  )

  // REFS
  const recordsRef = useRef(records)

  // Always maintain the latest records without making the editing
  // effects depend on the array reference.
  recordsRef.current = records

  // STATE SIGNATURE
  const recordsSignature = getRecordsSignature(records)

  // INITIAL STATE
  const [selectedDays, setSelectedDays] = useState<number[]>(
    () => buildStateFromRecords(records).selectedDays
  )

  const [dayConfigs, setDayConfigs] = useState<
    Record<number, DayConfig>
  >(
    () => buildStateFromRecords(records).dayConfigs
  )

  /**
   * Refreshes active Apollo queries.
   *
   * The mutation can update normalized entities automatically,
   * but it cannot necessarily reconcile the membership of an
   * existing list when some weekdays have been removed.
   */
  const refreshApolloCache = useCallback(async (): Promise<void> => {
    await client.refetchQueries({
      include: 'active'
    })
  }, [client])

  /**
   * Synchronizes the editable state when the actual record content
   * changes, not merely when the parent passes a new array reference.
   */
  useEffect(() => {
    const nextState = buildStateFromRecords(recordsRef.current)

    setSelectedDays(nextState.selectedDays)
    setDayConfigs(nextState.dayConfigs)
  }, [recordsSignature])

  /**
   * Toggles a weekday.
   *
   * A default time range is assigned the first time a day is enabled.
   * Existing time configurations are preserved when a day is disabled.
   */
  const handleDaySelection = useCallback((day: number): void => {
    if (
      !Number.isInteger(day) ||
      day < 0 ||
      day > 6
    ) {
      return
    }

    setSelectedDays((previous) => {
      if (previous.includes(day)) {
        return previous.filter(
          (selected) => selected !== day
        )
      }

      return [...previous, day].sort((a, b) => a - b)
    })

    setDayConfigs((previous) => {
      if (previous[day]) {
        return previous
      }

      return {
        ...previous,
        [day]: {
          startTime: DEFAULT_START_TIME,
          endTime: DEFAULT_END_TIME
        }
      }
    })
  }, [])

  /**
   * Updates the time range of a weekday.
   */
  const handleChange = useCallback(
    (
      day: number,
      field: 'startTime' | 'endTime',
      value: string
    ): void => {
      if (
        !Number.isInteger(day) ||
        day < 0 ||
        day > 6
      ) {
        return
      }

      setDayConfigs((previous) => ({
        ...previous,
        [day]: {
          startTime:
            previous[day]?.startTime ??
            DEFAULT_START_TIME,

          endTime:
            previous[day]?.endTime ??
            DEFAULT_END_TIME,

          [field]: value
        }
      }))
    },
    []
  )

  /**
   * Restores the editable state using the latest records received
   * from the parent component.
   */
  const reset = useCallback((): void => {
    const currentState = buildStateFromRecords(
      recordsRef.current
    )

    setSelectedDays(currentState.selectedDays)
    setDayConfigs(currentState.dayConfigs)
  }, [])

  /**
   * Persists the selected weekly schedule.
   *
   * After a successful mutation:
   * 1. Synchronizes the editable state with the backend response.
   * 2. Notifies the parent through onUpdated.
   * 3. Refetches active Apollo queries to refresh their cache.
   *
   * A cache refresh failure does not turn an already successful
   * backend mutation into a failed save.
   */
  const save = useCallback(
    async (): Promise<UpdateAvailableProductDaysResponse> => {
      const input = selectedDays.map((day) => ({
        idStore,
        pId,
        dayAvailable: day,
        startDate:
          dayConfigs[day]?.startTime ??
          DEFAULT_START_TIME,
        endDate:
          dayConfigs[day]?.endTime ??
          DEFAULT_END_TIME
      }))

      const response = await runUpdate({
        variables: {
          pId,
          input
        }
      })

      const result = (
        response?.data?.updateAvailableProduct ?? {
          success: false,
          message: 'No response from server'
        }
      ) as UpdateAvailableProductDaysResponse

      if (!result.success) {
        return result
      }

      // Synchronize the local state with the backend response.
      if (Array.isArray(result.data)) {
        const updatedState = buildStateFromRecords(
          result.data
        )

        setSelectedDays(updatedState.selectedDays)
        setDayConfigs(updatedState.dayConfigs)
      }

      // Notify the parent with the reconciled backend records.
      onUpdated?.(result.data ?? [])

      // Refresh Apollo queries only after the mutation succeeds.
      try {
        await refreshApolloCache()
      } catch (error) {
        // The backend mutation was successful.
        // A refetch failure must not report a failed save.
        console.error(
          '[useUpdateAvailableProductDays] Error refreshing Apollo cache:',
          error
        )
      }

      return result
    },
    [
      selectedDays,
      dayConfigs,
      idStore,
      pId,
      runUpdate,
      onUpdated,
      refreshApolloCache
    ]
  )

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
