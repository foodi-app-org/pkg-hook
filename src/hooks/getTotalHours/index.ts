/**
 * Schedule day structure
 */
export interface ScheduleDay {
  schHoSta?: string
  schHoEnd?: string
}

/**
 * Calculate total worked hours from a list of days.
 * Keeps original behavior and edge cases intact.
 *
 * @param {ScheduleDay[]} days - Array of days with start and end times
 * @returns {string} Total time formatted as HH:MM
 */
export const getTotalHours = (days: ScheduleDay[] = []): string => {
  const totalMinutesArray: number[] = days.map((day) => {
    const { schHoSta, schHoEnd } = day

    // Handle potential invalid time strings
    if (!isValidTimeString(schHoSta) || !isValidTimeString(schHoEnd)) {
      return 0
    }

    const [startHours, startMinutes] = schHoSta.split(':')
    const [endHours, endMinutes] = schHoEnd.split(':')

    // Convert hours and minutes to integers for calculations
    let totalHoursInt =
      parseInt(endHours, 10) - parseInt(startHours, 10)

    const totalMinutesInt =
      parseInt(endMinutes, 10) - parseInt(startMinutes, 10)

    // Handle negative total minutes
    let totalMinutes = totalMinutesInt
    if (totalMinutes < 0) {
      totalHoursInt--
      totalMinutes += 60
    }

    // Calculate total time in minutes
    return totalHoursInt * 60 + totalMinutes
  })

  // Sum all minutes
  const totalMinutes: number = totalMinutesArray.reduce(
    (acc, curr) => {return acc + curr},
    0
  )

  // Convert to hours and minutes
  const totalHours: number = Math.floor(totalMinutes / 60)
  const remainingMinutes: number = totalMinutes % 60

  // Format HH:MM
  const formattedHours = totalHours.toString().padStart(2, '0')
  const formattedMinutes = remainingMinutes.toString().padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}

/**
 * Validate time string format (HH:MM)
 *
 * @param {string | undefined} timeString
 * @returns {boolean}
 */
export const isValidTimeString = (
  timeString?: string
): timeString is string => {
  if (!timeString) return false

  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(timeString)
}
