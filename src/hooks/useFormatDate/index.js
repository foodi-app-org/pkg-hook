export const useFormatDate = ({
  date,
  local = 'ES-CO'
} = {}) => {
  const dateToFormat = new Date(date ?? Date.now())
  const fullDate = dateToFormat.toLocaleDateString(local, { year: 'numeric', month: '2-digit', day: '2-digit' })
  const day = fullDate.split('/')[0]
  const month = fullDate.split('/')[1]
  const year = fullDate.split('/')[2]
  const yearMonthDay = dateToFormat.toLocaleDateString('ES-CO')
  const numberDay = dateToFormat.getDay()
  const shortDayName = dateToFormat.toLocaleDateString(local, { weekday: 'short' })
  const longDayName = dateToFormat.toLocaleDateString(local, { weekday: 'long' })
  const hourMinutes12 = dateToFormat.toLocaleTimeString('ES-CO', { hour: '2-digit', minute: '2-digit' })
  const hourMinutes24 = dateToFormat.toLocaleTimeString('ES-CO', { hour: '2-digit', minute: '2-digit', hour12: false })
  const handleHourPmAM = (hour) => {
    const hourPmAm = new Date(`1/1/1999 ${hour}`).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    return hour ? hourPmAm : ''
  }
  /**
   * Formats a date into Colombian time zone and Spanish locale for POS display.
   * Example output: "15 de mayo de 2025 a las 14:23"
   *
   * @param {string | number | Date} dateInput - Date to format (ISO string, timestamp or Date object)
   * @returns {string} - Formatted date string in Colombian time
   */
  function formatDateInTimeZone (dateInput) {
    const timeZone = 'America/Bogota'
    const locale = 'es-CO'
    const options = {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }

    const date = new Date(dateInput)
    const formatted = new Intl.DateTimeFormat(locale, options).format(date)

    // Cambiar coma por "a las" para mejor legibilidad
    return formatted.replace(',', ' a las')
  }
  /**
   * Formats a date into YYYY-MM-DD using a given IANA timezone.
   *
   * @param {string | number | Date} inputDate - The date to format.
   * @param {string} timeZone - IANA timezone string (default is "America/Bogota").
   * @returns {string} Formatted date string in YYYY-MM-DD.
   * @throws {Error} If the input date is invalid.
   */
  const formatToLocalDateYMD = (inputDate, timeZone = 'America/Bogota') => {
    const date = new Date(inputDate)

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date input provided to formatToLocalDateYMD')
    }

    const localDateStr = date.toLocaleString('en-US', { timeZone })
    const localDate = new Date(localDateStr)

    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  return {
    day,
    fullDate,
    formatToLocalDateYMD,
    hourMinutes12,
    numberDay,
    yearMonthDay,
    hourMinutes24,
    longDayName,
    shortDayName,
    month,
    year,
    handleHourPmAM,
    formatDateInTimeZone
  }
}
