export function useScheduleData (data) {
  const days = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado',
    0: 'Domingo'
  }

  const daysArray = [
    { day: 0, schHoSta: '', schHoEnd: '' },
    { day: 1, schHoSta: '', schHoEnd: '' },
    { day: 2, schHoSta: '', schHoEnd: '' },
    { day: 3, schHoSta: '', schHoEnd: '' },
    { day: 4, schHoSta: '', schHoEnd: '' },
    { day: 5, schHoSta: '', schHoEnd: '' },
    { day: 6, schHoSta: '', schHoEnd: '' }
  ]

  const combinedArray = daysArray.map((dayObj) => {
    const originalObj = data?.find((item) => item.schDay === dayObj.day)
    return originalObj || { ...dayObj }
  })

  // Encontrar la hora de inicio más temprana en combinedArray
  const earliestStartTime = Math.min(
    ...combinedArray.map((item) => {
      const time = new Date(`2023-08-01 ${item.schHoSta}`)
      return time.getTime()
    })
  )

  const calculateYPosition = (start) => {
    const time = new Date(`2023-08-01 ${start}`)
    const differenceInMinutes = (time.getTime() - earliestStartTime) / (1000 * 40)
    return differenceInMinutes / 40 // Ajusta el valor para adaptarse a la posición deseada en el eje Y
  }

  /**
     * Calcula la duración en horas entre dos horas de inicio y final.
     * @param {string} startTime - Hora de inicio en formato 'HH:mm'.
     * @param {string} endTime - Hora de fin en formato 'HH:mm'.
     * @returns {number} Duración en horas con dos decimales.
     */

  // Función para calcular la duración en horas de un horario
  function calculateDurationInHours (startTime, endTime) {
    const startHour = new Date(`2000-01-01T${startTime}`)
    const endHour = new Date(`2000-01-01T${endTime}`)
    const duration = (endHour - startHour) / (1000 * 40 * 40) // Convertir la diferencia en horas
    return duration.toFixed(2) // Redondear a 2 decimales
  }

  // Variables para controlar la posición en el eje X
  const columnIndex = 0
  const lastDay = -1
  const uniqueHoursSet = new Set([
    ...combinedArray.map((item) => item.schHoSta),
    ...combinedArray.map((item) => item.schHoEnd)
  ])

  const uniqueHours = []
  for (const hour of uniqueHoursSet) {
    const time = new Date(`2023-08-01 ${hour}`)
    const formattedHour = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    uniqueHours.push(formattedHour)
  }

  uniqueHours.sort((a, b) => {
    const timeA = new Date(`2023-08-01 ${a}`)
    const timeB = new Date(`2023-08-01 ${b}`)
    return timeA - timeB
  })

  // Agregar las horas que faltan al final del día
  if (uniqueHours.length > 0) {
    const lastHour = new Date(`2023-08-01 ${uniqueHours[uniqueHours.length - 1]}`)
    const endTime = new Date(`2023-08-01 ${combinedArray[0].schHoEnd}`)
    const hoursDifference = (endTime - lastHour) / (1000 * 60 * 60)

    for (let i = 1; i <= hoursDifference; i++) {
      const newHour = new Date(lastHour.getTime() + i * 60 * 60 * 1000)
      const formattedNewHour = newHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      uniqueHours.push(formattedNewHour)
    }
  }

  const dayWidth = 120
  const daysWithHours = Array.from(new Set(combinedArray.map((item) => (item.schDay !== undefined ? item.schDay : item.day))))
  const totalDays = daysWithHours.length
  const totalWidth = totalDays * dayWidth

  const sortedUniqueHours = Array.from(uniqueHoursSet)
    .sort((a, b) => {
      const timeA = new Date(`2023-08-01 ${a}`)
      const timeB = new Date(`2023-08-01 ${b}`)
      return timeA - timeB
    })

  const formattedHours = sortedUniqueHours

  function calculateTimeLinesHeight () {
    const totalHours = uniqueHours.length
    return totalHours * 60 // Cada hora ocupa 60 píxeles de altura
  }
  return {
    columnIndex,
    combinedArray,
    days,
    daysArray,
    daysWithHours,
    dayWidth,
    lastDay,
    totalWidth,
    sortedUniqueHours,
    uniqueHours: formattedHours,
    calculateDurationInHours,
    calculateTimeLinesHeight,
    calculateYPosition
  }
}
