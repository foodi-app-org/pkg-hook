/**
     * Get the start timestamp for the current day.
     * @returns {string} The start timestamp for the current day.
     */
export const getStartOfDayTimestamp = () => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

/**
     * Get the end timestamp for the current day.
     * @returns {string} The end timestamp for the current day.
     */
export const getEndOfDayTimestamp = () => {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return end.toISOString()
}

/**
 * Get start and end timestamps for the current day.
 * @returns {Object} An object containing start and end timestamps.
 */
export const getTodayTimestamps = () => {
  return {
    startTimestamp: getStartOfDayTimestamp(),
    endTimestamp: getEndOfDayTimestamp()
  }
}

/**
 * Get start timestamp for a specific number of days ago.
 * @param {number} daysAgo - The number of days ago.
 * @returns {string} The start timestamp for the specified number of days ago.
 */
export const getStartTimestampDaysAgo = (daysAgo) => {
  if (isNaN(daysAgo) || daysAgo < 0) {
    throw new Error('Invalid input. Provide a valid number of days.')
  }

  const start = new Date()
  start.setDate(start.getDate() - daysAgo)
  start.setHours(0, 0, 0, 0)

  return start.toISOString()
}

export function convertDateFormat ({ dateString, start }) {
  const parsedDate = new Date(dateString)
  const year = parsedDate.getFullYear()
  const month = `0${parsedDate.getMonth() + 1}`.slice(-2)
  const day = `0${parsedDate.getDate()}`.slice(-2)

  if (start) {
    // Inicio del día (00:00:00)
    return `${year}-${month}-${day}T00:00:00.000Z`
  } else {
    // Final del día (23:59:59.999)
    const endOfDay = new Date(parsedDate)
    endOfDay.setHours(23, 59, 59, 999)
    return endOfDay.toISOString()
  }
}
