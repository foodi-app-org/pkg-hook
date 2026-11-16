export type WeeklyComparisonStatus =
  | 'NO_HISTORY'
  | 'NO_REFERENCE'
  | 'NO_ACTIVITY'
  | 'NEW_ACTIVITY'
  | 'INCREASED'
  | 'DECREASED'
  | 'UNCHANGED'

export interface WeeklyStockMovement {
  weekStart: string
  weekEnd: string
  totalOut: number | null
  prevTotalOut: number | null
  /** Legacy display field. N/A is not a zero and never participates in math. */
  percentageChange: string
  percentageValue: number | null
  comparisonStatus: WeeklyComparisonStatus
  isCurrent: boolean
  isPartial: boolean
  historyPartial: boolean
}

export type WeeklyStockWire = Omit<WeeklyStockMovement, 'percentageValue' | 'percentageChange'> & {
  percentageChange: number | null
}

const DAY_MS = 86_400_000
const statuses = new Set<string>([
  'NO_HISTORY', 'NO_REFERENCE', 'NO_ACTIVITY', 'NEW_ACTIVITY',
  'INCREASED', 'DECREASED', 'UNCHANGED'
])
const percentageStatuses = new Set(['INCREASED', 'DECREASED', 'UNCHANGED'])

const validDay = (value: unknown): value is string => {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
const validCount = (value: unknown): boolean => {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0)
}

/** Validate the API contract, never generate weeks or compute comparisons here. */
export const normalizeWeeklyStock = (rows: WeeklyStockWire[]): WeeklyStockMovement[] => {
  if (!Array.isArray(rows) || rows.length !== 7) {
    throw new Error('Respuesta semanal incompleta')
  }
  // A copied array avoids mutating Apollo's cache-owned objects.
  const sorted = [...rows].sort((a, b) => String(a?.weekStart).localeCompare(String(b?.weekStart)))

  return sorted.map((row, index) => {
    if (!row || !validDay(row.weekStart) || !validDay(row.weekEnd) ||
      new Date(row.weekStart).getUTCDay() !== 1 ||
      Date.parse(row.weekEnd) - Date.parse(row.weekStart) !== 6 * DAY_MS ||
      (index > 0 && Date.parse(row.weekStart) - Date.parse(sorted[index - 1].weekStart) !== 7 * DAY_MS) ||
      !validCount(row.totalOut) || !validCount(row.prevTotalOut) ||
      !statuses.has(row.comparisonStatus) ||
      typeof row.isPartial !== 'boolean' || typeof row.historyPartial !== 'boolean' ||
      row.isCurrent !== (index === 6) ||
      (row.isCurrent && !row.isPartial) || (row.historyPartial && !row.isPartial)) {
      throw new Error('Contrato semanal inválido')
    }

    const percentageValue = row.percentageChange
    const expectsPercentage = percentageStatuses.has(row.comparisonStatus)
    if (expectsPercentage
      ? (typeof percentageValue !== 'number' || !Number.isFinite(percentageValue) || row.totalOut === null || row.prevTotalOut === null || row.prevTotalOut <= 0)
      : percentageValue !== null) {
      throw new Error('Comparación semanal inválida')
    }
    if ((row.comparisonStatus === 'NO_HISTORY') !== (row.totalOut === null) ||
      (row.comparisonStatus === 'NEW_ACTIVITY' && !(row.prevTotalOut === 0 && row.totalOut !== null && row.totalOut > 0)) ||
      (row.comparisonStatus === 'NO_ACTIVITY' && !(row.prevTotalOut === 0 && row.totalOut === 0))) {
      throw new Error('Estado semanal inconsistente')
    }

    return {
      ...row,
      percentageValue,
      percentageChange: percentageValue === null ? 'N/A' : String(percentageValue)
    }
  })
}
