import { useMutation } from '@apollo/client'
import { useState } from 'react'

import { days } from './helpers/index'
import { CREATE_AVAILABLE_PRODUCTS_DAYS } from './queries'

export const useSaveAvailableProduct = () => {
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const handleDaySelection = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((selectedDay) => { return selectedDay !== day }))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }
  const handleCleanSelectedDays = () => {
    setSelectedDays([])
  }
  const [registerAvailableProduct, { loading }] = useMutation(CREATE_AVAILABLE_PRODUCTS_DAYS)
  return {
    handleDaySelection,
    handleCleanSelectedDays,
    selectedDays,
    setSelectedDays,
    days,
    Loading: loading,
    registerAvailableProduct
  }
}
