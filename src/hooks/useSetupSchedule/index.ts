import { useEffect, useState } from 'react'

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

export const useSetupSchedule = ({
  idStore = null, sendNotification = (args) => {
    return args
  }
} = {}) => {
  const [days, setDays] = useState(initialDays === null ? [] : initialDays)
  const [alertModal, setAlertModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState({})
  const [setStoreSchedule] = useCreateSchedules()

  const onCompleted = (data: any) => {
    if (Array.isArray(data) && data?.length > 0) {
      // Mapeamos los datos recibidos y los convertimos en un objeto con la estructura deseada
      const newSchedules = data.map((day) => {return {
        day: day.schDay,
        name: NameDays[day.schDay],
        selected: day.schHoEnd !== '00:00' || day.schHoSta !== '00:00',
        ...day
      }})

      // Actualizamos el estado days
      setDays(prevDays => {
        // Creamos un nuevo array combinando los elementos existentes en days con los nuevos datos
        const updatedDays = prevDays?.map(existingDay => {
          // Buscamos si hay un elemento con el mismo día en los nuevos datos
          const newData = newSchedules.find(newDay => {return newDay.day === existingDay.day})
          // Si encontramos el día en los nuevos datos, lo fusionamos con el día existente
          if (newData) {
            return { ...existingDay, ...newData }
          }
          // Si no encontramos el día en los nuevos datos, simplemente devolvemos el día existente
          return existingDay
        })

        // Ahora, buscamos los nuevos días que no están en days y los agregamos al array
        newSchedules.forEach(newDay => {
          if (!updatedDays.some(existingDay => {return existingDay.day === newDay.day})) {
            updatedDays.push(newDay)
          }
        })

        // Devolvemos el nuevo array actualizado
        return updatedDays
      })
    }
  }

  const [data, { loading: lsc }] = useSchedules({ schDay: 1 })

  const toggleCheck = (index) => {
    const updatedDays = [...days]
    updatedDays[index].checked = !updatedDays[index].checked
    setDays(updatedDays)
  }

  const duplicateDay = (index) => {
    const selectedDay = days[index]
    // Lógica para desplegar el modal y seleccionar los días donde se replicará
    const selectedDaysToDuplicate = days.filter((day) => {return day.checked})
    const updatedDays = [...days]
    selectedDaysToDuplicate.forEach((dayToDuplicate) => {
      const duplicatedDay = { ...selectedDay, checked: false }
      updatedDays.push(duplicatedDay)
    })
    setDays(updatedDays)
  }

  const handleSelectedDay = (day) => {
    const isSaved = days.find((data) => {
      return data.day === day
    })
    if (isSaved?.schId && isSaved?.selected) {
      setSelectedDay(isSaved)
      return setAlertModal(true)
    }
    const updatedDays = days?.map((d) => {
      if (d.day === day) {
        return { ...d, selected: !d.selected }
      } 
      return { ...d }
      
    })
    setDays(updatedDays)
  }
  const selectedDays = days?.filter((day) => {return Boolean(day.selected)}).map((day) => {
    return day.day
  })
  /**
   *
   * @param hora1
   * @param hora2
   */
  function sumHours (hora1, hora2) {
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
   */
  function isLessThanOneHour (hora1, hora2) {
    const suma = sumHours(hora1, hora2)
    const [sumaHour, sumMinutes] = suma.split(':').map(Number)
    const totalMinutos = (sumaHour * 60) + sumMinutes

    if (totalMinutos < 60) {
      return true // La suma de las horas es menor a una hora
    }
    return false // La suma de las horas es igual o mayor a una hora
  }
  const onChangeSaveHour = async ({ time, name, day }) => {
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
        const startHour = convertToMilitaryTime(schHoSta)
        const endHour = convertToMilitaryTime(schHoEnd)
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
            update (cache) {
              cache.modify({
                fields: {
                  getStoreSchedules (dataOld = []) {
                    return cache.writeQuery({ query: GET_SCHEDULE_STORE, data: dataOld })
                  },
                  getOneStoreSchedules (dataOld = []) {
                    return cache.writeQuery({ query: GET_ONE_SCHEDULE_STORE, data: dataOld })
                  }
                }
              })
            }
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

  const handleDeleteSchedule = async (day) => {
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
      update (cache) {
        cache.modify({
          fields: {
            getStoreSchedules (dataOld = []) {
              return cache.writeQuery({ query: GET_SCHEDULE_STORE, data: dataOld })
            },
            getOneStoreSchedules (dataOld = []) {
              return cache.writeQuery({ query: GET_ONE_SCHEDULE_STORE, data: dataOld })
            }
          }
        })
      }
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
