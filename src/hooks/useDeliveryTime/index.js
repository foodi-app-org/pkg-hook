import { useState } from 'react'

/**
 * Custom hook to handle delivery time input validation and formatting.
 * @returns {Object} An object containing state and functions for handling delivery time.
 */
export const useDeliveryTime = () => {
  const [deliveryTime, setDeliveryTime] = useState('')
  /**
   * Handles changes to the delivery time input.
   * @param {String} value - The input change value.
   */
  const handleDeliveryTimeChange = (value) => {
    setDeliveryTime(value)
  }

  return {
    deliveryTime,
    handleDeliveryTimeChange
  }
}
