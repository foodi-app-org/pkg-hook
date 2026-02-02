import { useEffect, useState } from 'react'
import type { SendNotificationFn } from 'typesdefs'

import { days as NameDays } from '../../utils'
import { convertToMilitaryTime } from '../convertToMilitaryTime'
import { useSchedules, useCreateSchedules } from '../useSchedule'
import { GET_ONE_SCHEDULE_STORE, GET_SCHEDULE_STORE } from '../useSchedule/queries'

import {
  dateEnum,
  initialDays,
  timeSuggestions
} from './helpers'
export * from './helpers/index'

interface IuseSetupScheduleProps {
  idStore?: number | null
  sendNotification?: SendNotificationFn
}
/**
 *
 * @param cache
 */
function updateCacheAfterScheduleChange(cache: any) {
  cache.modify({
    fields: {
      getStoreSchedules(dataOld = []) {
        return cache.writeQuery({ query: GET_SCHEDULE_STORE, data: dataOld })
      },
      getOneStoreSchedules(dataOld = []) {
        return cache.writeQuery({ query: GET_ONE_SCHEDULE_STORE, data: dataOld })
      }
    }
  })
}

interface ScheduleDay {
  schDay: number
  schHoEnd: string
  schHoSta: string
}

export interface NewSchedule {
  day: number
  name: string
  selected: boolean
  schDay: number
  schHoEnd: string
  schHoSta: string
  checked?: boolean // Added checked as optional property
  schId?: number // Added schId as optional property
}

export const useSetupSchedule = ({
  idStore = null,
  sendNotification = (args) => {
    return args
  }
}: IuseSetupScheduleProps = {}) => {
  const [days, setDays] = useState<NewSchedule[]>(
    initialDays === null
      ? []
      : (initialDays.map((d: any) => ({
        ...d,
        schDay: typeof d.schDay === 'number' ? d.schDay : d.day, // Ensure schDay exists
        selected: typeof d.selected === 'boolean' ? d.selected : false,
        schHoEnd: typeof d.schHoEnd === 'string' ? d.schHoEnd : '00:00',
        schHoSta: typeof d.schHoSta === 'string' ? d.schHoSta : '00:00',
        name: typeof d.name === 'string' ? d.name : NameDays[d.day]
      })) as NewSchedule[])
  )
  const [alertModal, setAlertModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState({})
  const [setStoreSchedule] = useCreateSchedules()

  // Helper function to merge existing days with new schedules
  const mergeSchedules = (prevDays: NewSchedule[], newSchedules: NewSchedule[]): NewSchedule[] => {
    return prevDays?.map((existingDay: NewSchedule) => {
      const newData = newSchedules.find((newDay: NewSchedule) => newDay.day === existingDay.day)
      if (newData) {
        return { ...existingDay, ...newData }
      }
      return existingDay
    })
  }

  // Helper function to add new days that are not in the existing days
  const addNewDays = (updatedDays: NewSchedule[], newSchedules: NewSchedule[]): NewSchedule[] => {
    newSchedules.forEach((newDay: NewSchedule) => {
      if (!updatedDays.some((existingDay: NewSchedule) => existingDay.day === newDay.day)) {
        updatedDays.push(newDay)
      }
    })
    return updatedDays
  }

  const updateSchedule = (newSchedules: NewSchedule[]) => {
    setDays((prevDays: NewSchedule[]) => {
      let updatedDays = mergeSchedules(prevDays, newSchedules)
      updatedDays = addNewDays(updatedDays, newSchedules)
      return updatedDays
    })
  }


  const onCompleted = (data: ScheduleDay[] | undefined) => {
    if (Array.isArray(data) && data?.length > 0) {
      // Mapeamos los datos recibidos y los convertimos en un objeto con la estructura deseada
      const newSchedules: NewSchedule[] = data.map((day: ScheduleDay) => {
        return {
          day: day.schDay,
          name: NameDays[day.schDay],
          selected: day.schHoEnd !== '00:00' || day.schHoSta !== '00:00',
          ...day
        }
      })

      // Actualizamos el estado days
      updateSchedule(newSchedules)
    }
  }



  const [data, { loading: lsc }] = useSchedules({ schDay: 1 })

  const toggleCheck = (index: number) => {
    const updatedDays = [...days]
    updatedDays[index].checked = !updatedDays[index].checked
    setDays(updatedDays)
  }

  const duplicateDay = (index: number) => {
    const selectedDay = days[index]
    // Lógica para desplegar el modal y seleccionar los días donde se replicará
    const selectedDaysToDuplicate = days.filter((day) => { return day.checked })
    const updatedDays = [...days]
    selectedDaysToDuplicate.forEach(() => {
      const duplicatedDay = { ...selectedDay, checked: false }
      updatedDays.push(duplicatedDay)
    })
    setDays(updatedDays)
  }

  const handleSelectedDay = (day: number) => {
    const isSaved = days.find((data: NewSchedule) => {
      return data.day === day
    })
    if (isSaved?.schId && isSaved?.selected) {
      setSelectedDay(isSaved)
      setAlertModal(true)
      return
    }
    const updatedDays = days?.map((d) => {
      if (d.day === day) {
        return { ...d, selected: !d.selected }
      }
      return { ...d }

    })
    setDays(updatedDays)
  }
  const selectedDays = days?.filter((day) => { return Boolean(day.selected) }).map((day) => {
    return day.day
  })
  /**
   *
   * @param hora1
   * @param hora2
   * @returns {string} The sum of the two times in HH:mm format.
   */
  const sumHours = (hora1: string, hora2: string) => {
    const [hora1Horas, hora1Minutos] = hora1.split(':').map(Number)
    const [hora2Horas, hora2Minutos] = hora2.split(':').map(Number)

    let sumaHour = hora1Horas + hora2Horas
    let sumMinutes = hora1Minutos + hora2Minutos

    if (sumMinutes >= 60) {
      sumMinutes -= 60
      sumaHour++
    }

    if (sumaHour >= 24) {
      sumaHour -= 24
    }

    const horaSumada = `${String(sumaHour).padStart(2, '0')}:${String(sumMinutes).padStart(2, '0')}`
    return horaSumada
  }
  /**
   *
   * @param hora1
   * @param hora2
   * @returns {boolean} Whether the sum of the two times is less than one hour.
   * */
  const isLessThanOneHour = (hora1: string, hora2: string) => {
    const suma = sumHours(hora1, hora2)
    const [sumaHour, sumMinutes] = suma.split(':').map(Number)
    const totalMinutos = (sumaHour * 60) + sumMinutes

    if (totalMinutos < 60) {
      return true // La suma de las horas es menor a una hora
    }
    return false // The sum of the hours is equal to or greater than one hour
  }
  const onChangeSaveHour = async ({ time, name, day }: { time: string, name: string, day: number }) => {
    setDays(prevDays => {
      const updatedDays = prevDays?.map((d) => {
        if (d.day === day) {
          return { ...d, [name]: time, loading: Boolean(name === dateEnum.schHoEnd) }
        }
        return { ...d }

      })

      if (name === dateEnum.schHoEnd) {
        const findHour = updatedDays.find((d) => {
          return d.day === day
        })
        const schHoSta = findHour?.schHoSta
        const schHoEnd = findHour?.schHoEnd
        const startHour = convertToMilitaryTime(schHoSta ?? '')
        const endHour = convertToMilitaryTime(schHoEnd ?? '')
        if (isLessThanOneHour(startHour, endHour)) {

          sendNotification({
            description: 'Error, el horario debe ser mayor a una hora',
            title: 'Error',
            backgroundColor: 'error'
          })
        }
        // Comparar solo las horas y minutos
        if (startHour === endHour) {

          sendNotification({
            description: 'Error, la hora de salida no debe ser igual a la hora final',
            title: 'Error',
            backgroundColor: 'error'
          })
        }
        if (startHour > endHour) {

          sendNotification({
            description: 'Error, la hora de salida debe ser mayor que la de entrada',
            title: 'Error',
            backgroundColor: 'error'
          })
        }

        if (startHour !== endHour && startHour < endHour && !isLessThanOneHour(startHour, endHour)) {
          setStoreSchedule({
            variables: {
              input: {
                schHoSta: schHoSta ?? '00:00',
                schHoEnd: schHoEnd ?? '00:00',
                schState: 1,
                schDay: day
              }
            },
            update: updateCacheAfterScheduleChange
          })
        }
        const newUpdatedDays = updatedDays.map((d) => {
          if (d.day === day) {
            return { ...d, loading: false }
          }
          return { ...d }

        })
        // Devolver el nuevo estado actualizado
        return newUpdatedDays
      }
      // Devolver el nuevo estado
      return updatedDays
    })
  }

  const handleDeleteSchedule = async (day: number) => {
    await setStoreSchedule({
      variables: {
        input: {
          schHoSta: '00:00',
          schHoEnd: '00:00',
          schState: 1,
          schDay: day,
          idStore
        }
      },
      update: updateCacheAfterScheduleChange
    })
    setDays(prevDays => {
      if (!prevDays) return []
      const updatedDays = prevDays?.map((d) => {
        if (d.day === day) {
          return {
            ...d,
            [dateEnum.schHoEnd]: dateEnum?.schHoEnd,
            [dateEnum.schHoSta]: dateEnum?.schHoSta,
            selected: false
          }
        }
        return { ...d }

      })
      return updatedDays
    })
    setAlertModal(false)
  }
  useEffect(() => {
    onCompleted(data)
  }, [data])

  return {
    duplicateDay,
    toggleCheck,
    handleSelectedDay,
    onChangeSaveHour,
    handleDeleteSchedule,
    setAlertModal,
    days,
    selectedDays,
    selectedDay,
    alertModal,
    loading: lsc,
    times: timeSuggestions
  }
}
