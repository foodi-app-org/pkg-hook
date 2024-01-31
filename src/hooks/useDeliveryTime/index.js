import { useState } from 'react'

/**
 * Custom hook to handle delivery time input validation and formatting.
 * @returns {Object} An object containing state and functions for handling delivery time.
 */
export const useDeliveryTime = () => {
  const [deliveryTime, setDeliveryTime] = useState('')

  /**
   * Validates and formats the delivery time input.
   * @param {string} input - The input string to validate.
   * @returns {string} The formatted delivery time or an empty string if invalid.
   */
  const validateDeliveryTime = (input) => {
    // Remove non-numeric characters
    const formattedInput = input.replace(/\D/g, '')

    // Ensure input length is no more than 5 characters (HH:MM)
    const sanitizedInput = formattedInput.slice(0, 5)

    // Parse hours and minutes
    const [hours = '0', minutes = '00'] = sanitizedInput.split(':').map(part => parseInt(part, 10))

    // Ensure hours and minutes are within range
    const validatedHours = Math.min(Math.max(0, hours), 60)
    const validatedMinutes = Math.min(Math.max(0, minutes), 59)

    // Format output
    const formattedTime = `${validatedHours.toString().padStart(2, '0')}:${validatedMinutes.toString().padStart(2, '0')}`
    return formattedTime
  }

  /**
   * Handles changes to the delivery time input.
   * @param {Event} event - The input change event.
   */
  const handleDeliveryTimeChange = (event) => {
    const formattedTime = validateDeliveryTime(event)
    setDeliveryTime(formattedTime)
  }

  return {
    deliveryTime,
    handleDeliveryTimeChange
  }
}
