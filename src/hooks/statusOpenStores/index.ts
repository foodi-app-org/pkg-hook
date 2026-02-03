import {
  getCurrentDayAndTime,
  getOpeningKeyFromDay,
  getTimeString,
  sortOpeningsByDay,
  weekDays,
  timeToInt,
  days
} from './helpers'

/**
 * Store schedule structure
 */
export interface StoreSchedule {
  schDay: number
  schHoSta?: string
  schHoEnd?: string
}

/**
 * Openings object structure
 */
export type OpeningsMap = Record<string, string>

/**
 * Store opening status result
 */
export interface OpeningStatus {
  message: string
  open: boolean
}

/**
 * Hook-like utility to calculate store open status
 *
 * @param {Object} params
 * @param {StoreSchedule[]} params.dataSchedules
 * @returns {OpeningStatus}
 */
export const statusOpenStores = (
  { dataSchedules = [] }: { dataSchedules?: StoreSchedule[] } = {}
): OpeningStatus => {
  const handleHourPmAM = (hour?: string): string => {
    if (!hour) return ''
    return new Date(`1/1/1999 ${hour}`).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  const handleState = (message: string, open: boolean): OpeningStatus => {return {
    message,
    open
  }}

  const getNextDaySchedule = (
    schedules: StoreSchedule[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentDayOfWeek: number
  ) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const dayOfWeekTomorrow = tomorrow.getDay()

    const findNextDay = schedules?.length
      ? schedules.some(
        (schedule) => {return schedule?.schDay === dayOfWeekTomorrow}
      )
      : false

    const findDataNextDay =
      schedules?.find(
        (schedule) => {return schedule?.schDay === dayOfWeekTomorrow}
      ) ?? { schDay: dayOfWeekTomorrow }

    return { findNextDay, findDataNextDay, dayOfWeekTomorrow }
  }

  const getOpeningStatus = (
    openings: OpeningsMap,
    currentTime: number,
    currentDayOfWeek: number
  ): OpeningStatus => {
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
      const opening =
        openings && openings[`opening${dayName.substring(0, 3)}`]

      const timeSpans = opening
        ?.split(';')
        .map((item) => {return item.trim()})

      for (const span of timeSpans ?? []) {
        const hours = span.split('-').map((item) => {return item.trim()})
        const openTime = timeToInt(hours[0])
        const closeTime = timeToInt(hours[1])

        if (currentTime >= openTime && currentTime <= closeTime) {
          return handleState(
            `Abierto Ahora - Cierra a las: ${handleHourPmAM(hours[1])}`,
            true
          )
        }

        if (
          currentTime < openTime &&
          dayOfWeek === currentDayOfWeek
        ) {
          return handleState(
            `Aun temprano - Abre hoy a las: ${handleHourPmAM(hours[0])}`,
            false
          )
        }

        if (
          currentTime >= closeTime - 30 * 60000 &&
          currentTime < closeTime &&
          dayOfWeek === currentDayOfWeek
        ) {
          return handleState(
            `Pronto por cerrar - Cierra hoy a las: ${handleHourPmAM(hours[1])}`,
            true
          )
        }

        const {
          findNextDay,
          findDataNextDay,
          dayOfWeekTomorrow
        } = getNextDaySchedule(dataSchedules, currentDayOfWeek)

        if (findNextDay && findDataNextDay?.schHoSta) {
          const nameOfDayTomorrow = weekDays[dayOfWeekTomorrow]
          return handleState(
            `Cerrado abre - Mañana ${nameOfDayTomorrow} a las ${
              findDataNextDay.schHoSta
            }`,
            false
          )
        }

        const nextDayName =
          weekDayLookup[(dayOfWeek + 1) % 7]

        const nextOpening =
          openings &&
          openings[`opening${nextDayName.substring(0, 3)}`]

        const nextHours = nextOpening
          ?.split(';')
          ?.map((item) => {return item.trim()})

        if (nextHours?.[0] !== ceroHours) {
          return handleState(
            `Cerrado - Abre el ${days[nextDayName as keyof typeof days]} a las ${nextHours?.[0]}`,
            false
          )
        }
      }

      dayOfWeek++
    }

    return handleState('Cerrado', false)
  }

  const getIsOpening = (openings: OpeningsMap): OpeningStatus => {
    const { currentTime, currentDayOfWeek } =
      getCurrentDayAndTime()

    return getOpeningStatus(
      openings,
      currentTime ?? 0,
      currentDayOfWeek ?? 0
    )
  }

  const createOpeningsObject = (
    schedules: StoreSchedule[]
  ): OpeningsMap => {
    const openings: OpeningsMap = {}
    const existStoreSchedule = schedules || []

    existStoreSchedule.forEach((schedule) => {
      const openingKey = getOpeningKeyFromDay(schedule.schDay)
      const schHoSta = getTimeString(schedule?.schHoSta as string)
      const schHoEnd = getTimeString(schedule?.schHoEnd as string)

      openings[openingKey] = `${schHoSta} - ${schHoEnd}`
    })

    for (let i = 0; i < 7; i++) {
      const openingKey = getOpeningKeyFromDay(i)
      if (!(openingKey in openings)) {
        openings[openingKey] = '00:00 - 00:00'
      }
    }

    return openings
  }

  const openings = createOpeningsObject(dataSchedules)
  const sortedOpenings = sortOpeningsByDay(openings)

  return getIsOpening(sortedOpenings)
}
