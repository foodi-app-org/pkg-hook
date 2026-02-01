const openingKeys = [
  'openingSun',
  'openingMon',
  'openingTue',
  'openingWed',
  'openingThu',
  'openingFri',
  'openingSat'
] as const;

type OpeningKey = typeof openingKeys[number];

export const getDayFromOpeningKey = (key: string): number => {
  const days: Record<OpeningKey, number> = {
    openingSun: 0,
    openingMon: 1,
    openingTue: 2,
    openingWed: 3,
    openingThu: 4,
    openingFri: 5,
    openingSat: 6
  };
  if (openingKeys.includes(key as OpeningKey)) {
    return days[key as OpeningKey];
  }
  return -1;
}

// Función para convertir el objeto de tiempo en una cadena de tiempo
/**
 *
 * @param timeStr
 * @returns {string}  Cadena de tiempo.
 */
export function getTimeString (timeStr: string | null | undefined): string {
  return timeStr || '00:00' // Return '00:00' for empty time strings
}

/**
 * Returns the current time in minutes and the current day of the week.
 * @returns {{ currentTime: number, currentDayOfWeek: number }} Object with currentTime and currentDayOfWeek.
 */
export function getCurrentDayAndTime () {
  const date = new Date()
  const currentTime = date.getHours() * 60 + date.getMinutes()
  const currentDayOfWeek = date.getDay()
  return { currentTime, currentDayOfWeek }
}

/**
 *
 * @param timeStr
 * @returns {{hours: number, minutes: number}}  Objeto con horas y minutos.
 */
export function getTimeObject (timeStr: string) {
  try {
    if (!timeStr || !/\d{2}:\d{2}/.test(timeStr)) {
      return { hours: 0, minutes: 0 } // Return default values for invalid input
    }
    const [hours, minutes] = timeStr.split(':').map(str => {return Number.parseInt(str)})
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
 * @returns {object}  Sorted openings.
 */
export function sortOpeningsByDay (openings: { [key: string]: string }) {
  const days = [
    'openingSun',
    'openingMon',
    'openingTue',
    'openingWed',
    'openingThu',
    'openingFri',
    'openingSat'
  ]
  const sortedOpenings: { [key: string]: string } = {}

  days.forEach((day) => {
    sortedOpenings[day] = openings[day] || '00:00 - 00:00' // Agregar horario vacío para los días faltantes
  })

  return sortedOpenings
}

// Función para obtener la clave de openings a partir del día de la semana
/**
 *
 * @param day
 * @returns {string}  Clave de openings.
 */
export function getOpeningKeyFromDay (day: number): string {
  const days: { [key: number]: string } = {
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
 * @returns {number}  Minutos totales.
 */
export function timeToInt (text: string): number {
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
