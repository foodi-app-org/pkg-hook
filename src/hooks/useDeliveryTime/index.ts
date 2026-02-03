import { useEffect, useState } from 'react'

interface UseDeliveryTimeProps {
  initialTime?: string
}

interface UseDeliveryTimeResult {
  deliveryTime: string
  handleDeliveryTimeChange: (value: string) => void
}

/**
 * Custom hook to handle delivery time input validation and formatting.
 * @param root0
 * @param root0.initialTime
 * @returns {UseDeliveryTimeResult}
 */
export const useDeliveryTime = ({
  initialTime = ''
}: UseDeliveryTimeProps): UseDeliveryTimeResult => {
  const [deliveryTime, setDeliveryTime] = useState(initialTime)
  useEffect(() => {
    if (initialTime) {
      setDeliveryTime(initialTime)
    }
  }, [initialTime])

  const handleDeliveryTimeChange = (value: string) => {
    setDeliveryTime(value)
  }

  return {
    deliveryTime,
    handleDeliveryTimeChange
  }
}
