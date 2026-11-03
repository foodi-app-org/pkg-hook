interface StockMovementData {
  date: string;
  TotalIn: number;
  TotalOut: number;
  TotalAdjustment: number;
}

/**
 * Formats a Date into a "YYYY-MM-DD" key using its LOCAL calendar date.
 *
 * Using `toISOString()` here would convert to UTC and, for negative-offset
 * timezones (e.g. America/Bogota, UTC-5), shift the evening of day N to day
 * N+1. That produced a phantom "tomorrow" bucket in the chart. Formatting with
 * local components keeps the key aligned with `Date.setDate`, which also
 * operates in local time.
 *
 * @param {Date} date - The date to format.
 * @returns {string} Local date in "YYYY-MM-DD" form.
 */
const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface DateRange {
  /** Inclusive start calendar date "YYYY-MM-DD". */
  from?: string
  /** Inclusive end calendar date "YYYY-MM-DD". */
  to?: string
}

/** Parses a "YYYY-MM-DD" key into a LOCAL Date (noon avoids DST edges). */
const parseDateKey = (key: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key)
  if (!match) return null
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0)
}

const MIN_DAYS = 7
const MAX_DAYS = 370

/**
 * Builds a continuous per-day series that INCLUDES every existing movement.
 *
 * Previous behavior clamped the chart to the last 7 days relative to the client
 * clock, which hid any real movement outside that window. Now the range is
 * derived from the actual data (min..max date returned by the backend) or from
 * the provided filter range (`from`/`to`) when available, and missing days are
 * zero-filled so the line stays continuous. A small minimum window is kept so a
 * single-movement day still renders a readable chart.
 *
 * @param data - Movements per day already mapped to chart fields.
 * @param range - Optional selected filter range (business calendar dates).
 * @returns Continuous, date-ascending series covering all movements.
 */
export const fillMissingDates = (
  data: StockMovementData[],
  range: DateRange = {}
): StockMovementData[] => {
  const byDate = new Map<string, StockMovementData>()
  for (const item of data) {
    if (item?.date) byDate.set(item.date, item)
  }

  // Determine the start/end of the window.
  const dataKeys = Array.from(byDate.keys()).sort()
  const firstData = dataKeys[0]
  const lastData = dataKeys[dataKeys.length - 1]

  const startKey = range.from || firstData
  const endKey = range.to || lastData

  // No data and no range: fall back to the last MIN_DAYS ending today so the
  // widget still renders an (empty) continuous axis.
  const today = new Date()
  let start = startKey ? parseDateKey(startKey) : null
  let end = endKey ? parseDateKey(endKey) : null

  if (!start || !end) {
    end = end ?? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)
    start = start ?? new Date(end)
    if (!startKey) start.setDate(end.getDate() - (MIN_DAYS - 1))
  }

  if (start > end) {
    const tmp = start
    start = end
    end = tmp
  }

  // Guard against an unbounded span.
  const spanDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1
  if (spanDays > MAX_DAYS) {
    start = new Date(end)
    start.setDate(end.getDate() - (MAX_DAYS - 1))
  }

  const filledData: StockMovementData[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const key = toLocalDateKey(cursor)
    filledData.push(
      byDate.get(key) || { date: key, TotalIn: 0, TotalOut: 0, TotalAdjustment: 0 }
    )
    cursor.setDate(cursor.getDate() + 1)
  }

  return filledData
}
