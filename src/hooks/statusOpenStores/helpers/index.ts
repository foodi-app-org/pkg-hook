export const getDayFromOpeningKey = (key) => {
  const days = {
    openingSun: 0,
    openingMon: 1,
    openingTue: 2,
    openingWed: 3,
    openingThu: 4,
    openingFri: 5,
    openingSat: 6
  }
  return days[key] !== undefined ? days[key] : -1
}

// Función para convertir el objeto de tiempo en una cadena de tiempo
/**
 *
 * @param timeStr
 */
export function getTimeString (timeStr) {
  return timeStr || '00:00' // Return '00:00' for empty time strings
}

/**
 *
 */
export function getCurrentDayAndTime () {
  try {
    const date = new Date()
    const currentTime = date.getHours() * 60 + date.getMinutes()
    const currentDayOfWeek = date.getDay()
    return { currentTime, currentDayOfWeek }
  } catch (error) {
    return {

    }
  }
}

/**
 *
 * @param timeStr
 */
export function getTimeObject (timeStr) {
  try {
    if (!timeStr || !/\d{2}:\d{2}/.test(timeStr)) {
      return { hours: 0, minutes: 0 } // Return default values for invalid input
    }
    const [hours, minutes] = timeStr.split(':').map(str => {return parseInt(str)})
    return { hours, minutes }
  } catch (e) {
    return { hours: 0, minutes: 0 } // Return default values on error
  }
}

/**
 *
 * @param openings
 */
export function sortOpeningsByDay (openings) {
  const days = [
    'openingSun',
    'openingMon',
    'openingTue',
    'openingWed',
    'openingThu',
    'openingFri',
    'openingSat'
  ]
  const sortedOpenings = {}

  days.forEach((day) => {
    sortedOpenings[day] = openings[day] || '00:00 - 00:00' // Agregar horario vacío para los días faltantes
  })

  return sortedOpenings
}

// Función para obtener la clave de openings a partir del día de la semana
/**
 *
 * @param day
 */
export function getOpeningKeyFromDay (day) {
  const days = {
    0: 'openingSun',
    1: 'openingMon',
    2: 'openingTue',
    3: 'openingWed',
    4: 'openingThu',
    5: 'openingFri',
    6: 'openingSat'
  }
  return days[day]
}

export const weekDays = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
]

/**
 *
 * @param text
 */
export function timeToInt (text) {
  const hour = parseInt(text.substring(0, 2))
  const minute = parseInt(text.substring(3))
  return hour * 60 + minute
}

export const days = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo'
}
