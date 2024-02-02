import { useEffect, useState } from 'react'

/**
 * Custom hook to handle delivery time input validation and formatting.
 * @returns {Object} An object containing state and functions for handling delivery time.
 */
export const useDeliveryTime = ({ initialTime = '' }) => {
  const [deliveryTime, setDeliveryTime] = useState(initialTime)
  useEffect(() => {
    if (initialTime) {
      setDeliveryTime(initialTime)
    }
  }, [initialTime])

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
