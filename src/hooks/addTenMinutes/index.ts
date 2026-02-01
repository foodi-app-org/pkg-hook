/**
 * Adds a 10-minute range based on a given minute value.
 *
 * @param num - Minute value between 1 and 60.
 * @returns A formatted string representing the minute range.
 *
 * @throws Error if the value is outside the allowed range.
 *
 * @example
 * addTenMinutes(20)
 * // "20 - 30 min"
 *
 * @example
 * addTenMinutes(55)
 * // "45 - 60 min"
 */
export const addTenMinutes = (num: number): string => {
  if (!Number.isInteger(num) || num < 1 || num > 60) {
    throw new Error('Minute value must be an integer between 1 and 60')
  }

  if (num >= 50) return `${num - 10} - 60 min`
  return `${num} - ${num + 10} min`
}
