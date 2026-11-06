/**
 * Raw availability record coming from the backend
 * (`getAllAvailableProduct` / `product_availables`).
 *
 * `dayAvailable` follows JS `Date.getDay()`: 0 = Sunday ... 6 = Saturday.
 * `startDate` / `endDate` are 24h strings in `HH:mm` format.
 */
export interface AvailableProductRecord {
  availableProductId?: string | null
  idStore?: string | null
  pId?: string | null
  dayAvailable?: number | null
  startDate?: string | null
  endDate?: string | null
  state?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

/** Normalized time range for a single day. */
export interface DayTimeRange {
  startDate: string
  endDate: string
}

/** A weekday with its label, short code and the time ranges it is available. */
export interface AvailableDay {
  /** 0 = Sunday ... 6 = Saturday (matches Date.getDay()). */
  day: number
  /** Short code used by the circular day selector (L, M, MI, J, V, S, D). */
  code: string
  /** Full localized name (Spanish). */
  name: string
  /** All time ranges configured for this day. */
  ranges: DayTimeRange[]
}

export const DEFAULT_START_TIME = '00:00'
export const DEFAULT_END_TIME = '23:59'

/** Full Spanish names indexed by JS weekday (0 = Sunday). */
export const WEEKDAY_FULL_NAMES: string[] = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
]

/** Short codes indexed by JS weekday (0 = Sunday). Matches `days` helper. */
export const WEEKDAY_SHORT_CODES: string[] = [
  'D',
  'L',
  'M',
  'MI',
  'J',
  'V',
  'S'
]

/** Icon keys (from pkg-components `Icon`) used to represent each weekday. */
export const WEEKDAY_ICON = 'IconSimpleCalendar'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

/**
 * Converts a `HH:mm` string into minutes since midnight.
 * @param {string | null} [time] - Time in 24h `HH:mm` format.
 * @returns {number | null} Minutes since midnight, or `null` when invalid.
 */
export const timeToMinutes = (time?: string | null): number | null => {
  if (!time || !TIME_PATTERN.test(time)) {
    return null
  }
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Keeps only ACTIVE records (state === 1) when a state is present.
 * Records without an explicit state are kept (backwards compatibility).
 * @param {AvailableProductRecord[]} records - Raw availability records.
 * @returns {AvailableProductRecord[]} Only the active records.
 */
export const filterActiveRecords = (
  records: AvailableProductRecord[]
): AvailableProductRecord[] => {
  return records.filter((record) => {
    return record?.state === undefined || record?.state === null || record.state === 1
  })
}

/**
 * Groups raw availability records by weekday, returning a sorted list of
 * `AvailableDay`. Ranges inside each day are sorted by start time. Invalid
 * `dayAvailable` values (outside 0..6) are ignored so a corrupt row never
 * breaks the UI.
 * @param {AvailableProductRecord[] | null | undefined} records - Raw records.
 * @returns {AvailableDay[]} Sorted availability grouped by weekday.
 */
export const groupAvailabilityByDay = (
  records: AvailableProductRecord[] | null | undefined
): AvailableDay[] => {
  if (!Array.isArray(records) || records.length === 0) {
    return []
  }

  const active = filterActiveRecords(records)
  const byDay = new Map<number, DayTimeRange[]>()

  for (const record of active) {
    const day = Number(record?.dayAvailable)
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      continue
    }

    const startDate = record?.startDate ?? DEFAULT_START_TIME
    const endDate = record?.endDate ?? DEFAULT_END_TIME

    const ranges = byDay.get(day) ?? []
    ranges.push({ startDate, endDate })
    byDay.set(day, ranges)
  }

  return Array.from(byDay.entries())
    .map(([day, ranges]) => ({
      day,
      code: WEEKDAY_SHORT_CODES[day] ?? '',
      name: WEEKDAY_FULL_NAMES[day] ?? '',
      ranges: ranges.sort((a, b) => {
        return (timeToMinutes(a.startDate) ?? 0) - (timeToMinutes(b.startDate) ?? 0)
      })
    }))
    .sort((a, b) => a.day - b.day)
}

/**
 * Returns true when `now` falls inside the `HH:mm` range. Supports overnight
 * ranges (e.g. 22:00 - 02:00). When either bound is invalid the range is
 * treated as "all day" (available).
 * @param {DayTimeRange} range - Time range with `startDate` and `endDate`.
 * @param {Date} now - Reference moment to test.
 * @returns {boolean} Whether `now` is inside the range.
 */
export const isWithinRange = (
  range: DayTimeRange,
  now: Date
): boolean => {
  const start = timeToMinutes(range.startDate)
  const end = timeToMinutes(range.endDate)

  if (start === null || end === null) {
    return true
  }

  const current = now.getHours() * 60 + now.getMinutes()

  // Same-day range.
  if (start <= end) {
    return current >= start && current <= end
  }

  // Overnight range: available either after start OR before end.
  return current >= start || current <= end
}

/**
 * Determines whether the product is available at `now`. Rules:
 *  - No records -> available (interpreted as "available all week").
 *  - Records exist but none for today -> NOT available.
 *  - Today has a range covering `now` -> available; otherwise NOT available.
 * @param {AvailableProductRecord[] | null | undefined} records - Raw records.
 * @param {Date} [now] - Reference moment (defaults to current time).
 * @returns {boolean} Whether the product is available right now.
 */
export const isAvailableNow = (
  records: AvailableProductRecord[] | null | undefined,
  now: Date = new Date()
): boolean => {
  const grouped = groupAvailabilityByDay(records)

  // No explicit schedule means the product is always available.
  if (grouped.length === 0) {
    return true
  }

  const today = now.getDay()
  const todayConfig = grouped.find((entry) => entry.day === today)

  if (!todayConfig) {
    return false
  }

  return todayConfig.ranges.some((range) => isWithinRange(range, now))
}

/**
 * Convenience summary used by UI components.
 */
export interface AvailabilitySummary {
  /** Grouped, sorted availability per weekday. */
  days: AvailableDay[]
  /** Short codes selected (used by the circular day selector). */
  selectedCodes: string[]
  /** Weekday numbers selected (0..6). */
  selectedDays: number[]
  /** Whether the product has an explicit weekly schedule. */
  hasSchedule: boolean
  /** Whether the product is available right now. */
  availableToday: boolean
}

/**
 * Builds a UI-friendly availability summary from raw records.
 * @param {AvailableProductRecord[] | null | undefined} records - Raw records.
 * @param {Date} [now] - Reference moment (defaults to current time).
 * @returns {AvailabilitySummary} Days, selected codes/days and today flag.
 */
export const buildAvailabilitySummary = (
  records: AvailableProductRecord[] | null | undefined,
  now: Date = new Date()
): AvailabilitySummary => {
  const days = groupAvailabilityByDay(records)

  return {
    days,
    selectedCodes: days.map((entry) => entry.code).filter(Boolean),
    selectedDays: days.map((entry) => entry.day),
    hasSchedule: days.length > 0,
    availableToday: isAvailableNow(records, now)
  }
}
