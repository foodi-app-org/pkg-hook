import { useEffect, useState } from 'react'
import {
  getDayFromOpeningKey,
  getCurrentDayAndTime,
  getOpeningKeyFromDay,
  getTimeString,
  sortOpeningsByDay,
  weekDays,
  timeToInt,
  days,
  getTimeObject
} from './helpers'
import { useFormatDate } from '../useFormatDate'

export const useStatusOpenStore = ({ dataSchedules = [] } = {}) => {
  const [open, setOpen] = useState('')
  const [openNow, setOpenNow] = useState(false)
  const { handleHourPmAM } = useFormatDate({
    date: null
  })

  const handleMessageHour = (message, open) => {
    setOpen(message)
    setOpenNow(open)
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
          return handleMessageHour(
            'Abierto Ahora - Cierra a las: ' + handleHourPmAM(hours[1]),
            true
          )
        }

        if (currentTime < openTime && dayOfWeek === currentDayOfWeek) {
          return handleMessageHour(
            'Aun temprano - Abre hoy a las: ' + handleHourPmAM(hours[0]),
            false
          )
        }

        if (currentTime >= closeTime - 30 * 60000 && currentTime < closeTime && dayOfWeek === currentDayOfWeek) {
          return handleMessageHour(
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
          return handleMessageHour(
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
          return handleMessageHour(
            'Cerrado - Abre el ' + days[nextDayName] + ' a las ' + nextHours[0],
            false
          )
        }
      }

      dayOfWeek++
    }

    return handleMessageHour('Cerrado', false)
  }

  function getIsOpening (openings) {
    const { currentTime, currentDayOfWeek } = getCurrentDayAndTime()
    return getOpeningStatus(openings, currentTime, currentDayOfWeek)
  }

  useEffect(() => {
    (() => {
      // Crear el objeto openings a partir del existStoreSchedule
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
        if (!openings.hasOwnProperty(openingKey)) {
          openings[openingKey] = '00:00 - 00:00' // Horario vacío para el día faltante
        }
      }

      // Ejemplo de uso con el objeto proporcionado
      const sortedOpenings = sortOpeningsByDay(openings)

      // Crear el array completo con objetos de tiempo
      // eslint-disable-next-line no-unused-vars
      const fullArray = Object.keys(sortedOpenings).map((key) => {
        const day = getDayFromOpeningKey(key)
        const [schHoSta, schHoEnd] = openings[key].split(' - ').map(timeStr => getTimeObject(timeStr))
        return {
          __typename: 'StoreSchedule',
          schId: '',
          idStore: '',
          schDay: day,
          schHoSta: `${schHoSta?.hours?.toString().padStart(2, '0')}:${schHoSta?.minutes?.toString().padStart(2, '0')}`,
          schHoEnd: `${schHoEnd?.hours?.toString().padStart(2, '0')}:${schHoEnd?.minutes?.toString().padStart(2, '0')}`,
          schState: 1
        }
      })
      getIsOpening(sortedOpenings)
    })()
  }, [dataSchedules])

  return {
    open,
    openNow
  }
}
