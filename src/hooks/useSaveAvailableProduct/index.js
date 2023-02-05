import { useState } from "react"

export const useSaveAvailableProduct = () => {
    const [selectedDays, setSelectedDays] = useState([])
    const days = [
       
        {
          day: 1,
          name: 'L'
        },
        {
          day: 2,
          name: 'M'
        },
        {
          day: 3,
          name: 'M'
        },
        {
          day: 4,
          name: 'J'
        },
        {
          day: 5,
          name: 'V'
        },
        {
          day: 6,
          name: 'S'
        },
        {
            day: 0,
            name: 'D'
        },
      ]
    const handleDaySelection = (day) => {
        if (selectedDays.includes(day)) {
          setSelectedDays(selectedDays.filter((selectedDay) => {return selectedDay !== day}))
        } else {
          setSelectedDays([...selectedDays, day])
        }
      }
  return {
    handleDaySelection,
    selectedDays,
    days,
    Loading: false
  }
}
