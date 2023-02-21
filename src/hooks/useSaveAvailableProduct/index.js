import { useMutation } from "@apollo/client";
import { useState } from "react";
import { days } from './helpers/index';
import { CREATE_AVAILABLE_PRODUCTS_DAYS } from "./queries";

export const useSaveAvailableProduct = () => {
    const [selectedDays, setSelectedDays] = useState([])

    const handleDaySelection = (day) => {
        if (selectedDays.includes(day)) {
          setSelectedDays(selectedDays.filter((selectedDay) => {return selectedDay !== day}))
        } else {
          setSelectedDays([...selectedDays, day])
        }
      }
      const [registerAvailableProduct, { loading }] = useMutation(CREATE_AVAILABLE_PRODUCTS_DAYS, {
        onError: () => { return console.log({ message: 'Lo sentimos ocurrió un error, vuelve a intentarlo' }) },
      })
  return {
    handleDaySelection,
    selectedDays,
    days,
    Loading: loading,
    registerAvailableProduct,
  }
}
