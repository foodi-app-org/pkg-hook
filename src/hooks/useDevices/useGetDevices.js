import { useState, useEffect } from 'react'
import { useQuery } from '@apollo/client'
import { GET_ALL_DEVICES } from './queries'
import { useFormatDate } from '../useFormatDate'

export const useDevices = () => {
  const { data, loading } = useQuery(GET_ALL_DEVICES, {
    onError: (error) => {
      console.error(error)
    }
  })
  const [deviceId, setDeviceId] = useState(false)
  const [date, setDate] = useState('')

  useEffect(() => {
    if (window) {
      setDeviceId(window.localStorage.getItem('deviceid'))
    }
  }, [])

  // Función para formatear la fecha
  const formatDate = useFormatDate({ date })

  const updateDate = (newDate) => {
    setDate(newDate)
  }
  return {
    data: data?.getDeviceUsers || [],
    date,
    deviceId,
    formatDate,
    loading,
    updateDate
  }
}
