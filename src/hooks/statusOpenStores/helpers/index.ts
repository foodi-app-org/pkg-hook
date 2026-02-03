export const getDayFromOpeningKey = (
  key: 'openingSun' | 'openingMon' | 'openingTue' | 'openingWed' | 'openingThu' | 'openingFri' | 'openingSat'
) => {
  const days = {
    openingSun: 0,
    openingMon: 1,
    openingTue: 2,
    openingWed: 3,
    openingThu: 4,
    openingFri: 5,
    openingSat: 6
  }
  if (days[key] === undefined) {
    return -1
  }
  return days[key]
}

// Función para convertir el objeto de tiempo en una cadena de tiempo
/**
 *
 * @param timeStr
 * @returns time string
 */
export function getTimeString(timeStr: string) {
  return timeStr || '00:00' // Return '00:00' for empty time strings
}

/**
 * @returns current day of week and time in minutes
 */
export function getCurrentDayAndTime() {
  try {
    const date = new Date()
    const currentTime = date.getHours() * 60 + date.getMinutes()
    const currentDayOfWeek = date.getDay()
    return { currentTime, currentDayOfWeek }
  } catch (error) {
    if (error instanceof Error) {
      return {
        currentTime: 0,
        currentDayOfWeek: 0
      }
    }
    return {
      currentTime: 0,
      currentDayOfWeek: 0
    }
  }
}

/**
 *
 * @param timeStr
 * @returns time object with hours and minutes
 */
export function getTimeObject(timeStr: string) {
  try {
    if (!timeStr || !/\d{2}:\d{2}/.test(timeStr)) {
      return { hours: 0, minutes: 0 } // Return default values for invalid input
    }
    const [hours, minutes] = timeStr.split(':').map(str => { return Number.parseInt(str) })
    return { hours, minutes }
  } catch (e) {
    if (e instanceof Error) {
      return { hours: 0, minutes: 0 } // Return default values on error
    }
    return { hours: 0, minutes: 0 } // Return default values on error
  }
}

/**
 *
 * @param openings
 * @returns sorted openings by day
 */
export function sortOpeningsByDay(openings: Record<string, string>) {
  const days = [
    'openingSun',
    'openingMon',
    'openingTue',
    'openingWed',
    'openingThu',
    'openingFri',
    'openingSat'
  ]
  const sortedOpenings: Record<string, string> = {}

  days.forEach((day) => {
    sortedOpenings[day] = openings[day] || '00:00 - 00:00' // Agregar horario vacío para los días faltantes
  })

  return sortedOpenings
}

// Función para obtener la clave de openings a partir del día de la semana
/**
 *
 * @param day
 * @returns opening key from day
 */
export function getOpeningKeyFromDay(day: number) {
  const days: Record<number, string> = {
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
 * @returns time in integer minutes
 */
export function timeToInt(text: string) {
  const hour = Number.parseInt(text.substring(0, 2))
  const minute = Number.parseInt(text.substring(3))
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
