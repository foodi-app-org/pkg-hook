import { useEffect, useState } from 'react'

import { useFormatDate } from '../useFormatDate'

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

type StoreSchedule = {
  schDay: number
  schHoSta: string
  schHoEnd: string
}

export const useStatusOpenStore = ({ dataSchedules = [] }: { dataSchedules?: StoreSchedule[] }) => {
  const [open, setOpen] = useState('')
  const [openNow, setOpenNow] = useState(false)
  const { handleHourPmAM } = useFormatDate({
    date: undefined
  })

  const handleMessageHour = (message: string, open: boolean) => {
    setOpen(message)
    setOpenNow(open)
  }

  /**
   *
   * @param dataSchedules
   * @param currentDayOfWeek
   * @returns {{ findNextDay: boolean, findDataNextDay: StoreSchedule | {} , dayOfWeekTomorrow: number }}
   */
  function getNextDaySchedule(dataSchedules: StoreSchedule[]) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const dayOfWeekTomorrow = tomorrow.getDay()

    const findNextDay = dataSchedules?.length
      ? dataSchedules?.some((schedule: StoreSchedule) => { return schedule?.schDay === dayOfWeekTomorrow })
      : false

    const findDataNextDay = dataSchedules?.length
      ? dataSchedules?.find((schedule: StoreSchedule) => { return schedule?.schDay === dayOfWeekTomorrow })
      : {}

    return { findNextDay, findDataNextDay, dayOfWeekTomorrow }
  }

  /**
   *
   * @param openings
   * @param currentTime
   * @param currentDayOfWeek
   * @returns {{message: string, isOpen: boolean}}  Estado de apertura.
   */
  function getOpeningStatus(openings: { [key: string]: string }, currentTime: number, currentDayOfWeek: number) {
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
      const timeSpans = opening?.split(';').map((item) => { return item.trim() })

      for (const span of timeSpans) {
        const hours = span.split('-').map((item) => { return item.trim() })
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

        const {
          findNextDay,
          findDataNextDay,
          dayOfWeekTomorrow
        } = getNextDaySchedule(
          dataSchedules
        )

        if (
          findNextDay &&
          typeof findDataNextDay === 'object' &&
          findDataNextDay !== null &&
          'schHoSta' in findDataNextDay &&
          typeof (findDataNextDay as StoreSchedule).schHoSta === 'string'
        ) {
          const nameOfDayTomorrow = weekDays[dayOfWeekTomorrow]
          return handleMessageHour(
            `Cerrado abre Mañana ${nameOfDayTomorrow} ${Boolean((findDataNextDay as StoreSchedule).schHoSta) && 'a las'} ${handleHourPmAM((findDataNextDay as StoreSchedule).schHoSta) ?? ''
            }`,
            false
          )
        }

        const nextDayName = weekDayLookup[(dayOfWeek + 1) % 7]
        const nextOpening = openings?.['opening' + nextDayName.substring(0, 3)]
        const nextHours = nextOpening?.split(';')?.map((item) => { return item?.trim() })

        if (nextHours[0] !== ceroHours) {
          return handleMessageHour(
            'Cerrado - Abre el ' + days[nextDayName as keyof typeof days] + ' a las ' + nextHours[0],
            false
          )
        }
      }

      dayOfWeek++
    }

    return handleMessageHour('Cerrado', false)
  }

  /**
   *
   * @param openings
   *  @returns {{currentTime: number, currentDayOfWeek: number}}  Estado de apertura.
   */
  function getIsOpening(openings: { [key: string]: string }) {
    const { currentTime, currentDayOfWeek } = getCurrentDayAndTime()
    return getOpeningStatus(openings, currentTime, currentDayOfWeek)
  }

  // Helper function to create schedule object from key and openings
  /**
   *
   * @param key
   * @param openings
   * @returns {object}  Objeto de horario.
   */
  function createScheduleObject(key: string, openings: { [key: string]: string }) {
    const day = getDayFromOpeningKey(key)
    const [schHoSta, schHoEnd] = openings[key].split(' - ').map((timeStr: string) => getTimeObject(timeStr))
    return {
      __typename: 'StoreSchedule',
      schId: '',
      idStore: '',
      schDay: day,
      schHoSta: `${schHoSta?.hours?.toString().padStart(2, '0')}:${schHoSta?.minutes?.toString().padStart(2, '0')}`,
      schHoEnd: `${schHoEnd?.hours?.toString().padStart(2, '0')}:${schHoEnd?.minutes?.toString().padStart(2, '0')}`,
      schState: 1
    }
  }

  useEffect(() => {
    (() => {
      // Crear el objeto openings a partir del existStoreSchedule
      const openings: { [key: string]: string } = {}
      const existStoreSchedule = dataSchedules || []
      existStoreSchedule?.forEach((schedule: StoreSchedule) => {
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
      Object.keys(sortedOpenings).forEach((key) => {
        createScheduleObject(key, openings)
      })
      getIsOpening(sortedOpenings)
    })()
  }, [dataSchedules])

  return {
    open,
    openNow
  }
}
