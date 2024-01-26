import {
  getCurrentDayAndTime,
  getOpeningKeyFromDay,
  getTimeString,
  sortOpeningsByDay,
  weekDays,
  timeToInt,
  days
} from './helpers'

export const statusOpenStores = ({
  dataSchedules = []
} = {}) => {
  const handleHourPmAM = (hour) => {
    const hourPmAm = new Date(`1/1/1999 ${hour}`).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    return hour ? hourPmAm : ''
  }

  const handleState = (message, open) => {
    return {
      message,
      open
    }
  }
  function getNextDaySchedule (dataSchedules, currentDayOfWeek) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayOfWeekTomorrow = tomorrow.getDay()

    const findNextDay = dataSchedules?.length
      ? dataSchedules?.some((schedule) => schedule?.schDay === dayOfWeekTomorrow)
      : false

    const findDataNextDay = dataSchedules?.length
      ? dataSchedules?.find((schedule) => schedule?.schDay === dayOfWeekTomorrow)
      : {}

    return { findNextDay, findDataNextDay, dayOfWeekTomorrow }
  }

  function getOpeningStatus (openings, currentTime, currentDayOfWeek) {
    const weekDayLookup = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ]

    const ceroHours = '00:00 - 00:00'
    let dayOfWeek = currentDayOfWeek

    for (let i = 0; i < 7; i++) {
      const dayName = weekDayLookup[dayOfWeek % 7]
      const opening = openings && openings['opening' + dayName.substring(0, 3)]
      const timeSpans = opening?.split(';').map((item) => item.trim())

      for (const span of timeSpans) {
        const hours = span.split('-').map((item) => item.trim())
        const openTime = timeToInt(hours[0])
        const closeTime = timeToInt(hours[1])

        if (currentTime >= openTime && currentTime <= closeTime) {
          return handleState(
            'Abierto Ahora - Cierra a las: ' + handleHourPmAM(hours[1]),
            true
          )
        }

        if (currentTime < openTime && dayOfWeek === currentDayOfWeek) {
          return handleState(
            'Aun temprano - Abre hoy a las: ' + handleHourPmAM(hours[0]),
            false
          )
        }

        if (currentTime >= closeTime - 30 * 60000 && currentTime < closeTime && dayOfWeek === currentDayOfWeek) {
          return handleState(
            'Pronto por cerrar - Cierra hoy a las: ' + handleHourPmAM(hours[1]),
            true
          )
        }

        const { findNextDay, findDataNextDay, dayOfWeekTomorrow } = getNextDaySchedule(
          dataSchedules,
          currentDayOfWeek
        )

        if (findNextDay && findDataNextDay?.schHoSta) {
          const nameOfDayTomorrow = weekDays[dayOfWeekTomorrow]
          return handleState(
                `Cerrado - Mañana ${nameOfDayTomorrow} ${!!findDataNextDay?.schHoSta && 'a las'} ${
                  findDataNextDay?.schHoSta ? findDataNextDay?.schHoSta : ''
                }`,
                false
          )
        }

        const nextDayName = weekDayLookup[(dayOfWeek + 1) % 7]
        const nextOpening = openings && openings['opening' + nextDayName.substring(0, 3)]
        const nextHours = nextOpening?.split(';')?.map((item) => item?.trim())

        if (nextHours[0] !== ceroHours) {
          return handleState(
            'Cerrado - Abre el ' + days[nextDayName] + ' a las ' + nextHours[0],
            false
          )
        }
      }

      dayOfWeek++
    }

    return handleState('Cerrado', false)
  }

  function getIsOpening (openings) {
    const { currentTime, currentDayOfWeek } = getCurrentDayAndTime()
    return getOpeningStatus(openings, currentTime, currentDayOfWeek)
  }

  const createOpeningsObject = (dataSchedules) => {
    const openings = {}
    const existStoreSchedule = dataSchedules || []

    existStoreSchedule?.forEach((schedule) => {
      const day = schedule.schDay
      const openingKey = getOpeningKeyFromDay(day)
      const schHoSta = getTimeString(schedule?.schHoSta)
      const schHoEnd = getTimeString(schedule?.schHoEnd)
      openings[openingKey] = `${schHoSta} - ${schHoEnd}`
    })

    for (let i = 0; i < 7; i++) {
      const openingKey = getOpeningKeyFromDay(i)
      // eslint-disable-next-line no-prototype-builtins
      if (!(openingKey in openings)) {
        openings[openingKey] = '00:00 - 00:00' // Horario vacío para el día faltante
      }
    }

    return openings
  }

  // Luego puedes usar esta función así:
  const openings = createOpeningsObject(dataSchedules)
  // ...haz lo que necesites con el objeto openings
  const sortedOpenings = sortOpeningsByDay(openings)

  // Crear el array completo con objetos de tiempo
  return getIsOpening(sortedOpenings)
}
