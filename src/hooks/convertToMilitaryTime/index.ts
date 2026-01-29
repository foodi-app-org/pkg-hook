export function convertToMilitaryTime (time12Hour) {
  const [time, period] = time12Hour.split(' ')
  let [hours, minutes] = time.split(':')

  if (period === 'PM' && hours !== '12') {
    hours = String(Number(hours) + 12)
  }

  if (period === 'AM' && hours === '12') {
    hours = '00'
  }

  return `${hours}:${minutes}`
}
