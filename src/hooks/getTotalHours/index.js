export const getTotalHours = (days = []) => {
  const totalMinutesArray = days?.map((day) => {
    const { schHoSta, schHoEnd } = day

    // Handle potential invalid time strings
    if (!isValidTimeString(schHoSta) || !isValidTimeString(schHoEnd)) {
      return 0 // Ignore invalid time strings and return 0
    }

    const [startHours, startMinutes] = schHoSta.split(':')
    const [endHours, endMinutes] = schHoEnd.split(':')

    // Convert hours and minutes to integers for calculations
    let totalHoursInt = parseInt(endHours, 10) - parseInt(startHours, 10)
    const totalMinutesInt = parseInt(endMinutes, 10) - parseInt(startMinutes, 10)

    // Handle negative total minutes (occurs when endMinutes < startMinutes)
    let totalMinutes = totalMinutesInt
    if (totalMinutes < 0) {
      totalHoursInt-- // Decrement total hours for negative minutes
      totalMinutes += 60 // Add 60 minutes to account for borrowing from previous hour
    }

    // Calculate total time in minutes
    const totalTimeMinutes = totalHoursInt * 60 + totalMinutes

    return totalTimeMinutes
  })

  // Calculate the sum of total minutes for all days
  const totalMinutes = totalMinutesArray.reduce((acc, curr) => acc + curr, 0)

  // Convert total minutes to hours and minutes format
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  // Format the total time as "00:00"
  const formattedHours = totalHours.toString().padStart(2, '0')
  const formattedMinutes = remainingMinutes.toString().padStart(2, '0')

  return `${formattedHours}:${formattedMinutes}`
}

// Function to validate time string format (HH:MM)
export const isValidTimeString = (timeString) => {
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(timeString)
}
