import { useQuery } from '@apollo/client'
import { GET_ALL_DEVICES } from './queries'

export const useDevices = () => {
  const { data, loading } = useQuery(GET_ALL_DEVICES, {
    onError: (error) => {
      console.error(error)
    }
  })

  // Función para formatear la fecha
  // const { formatDateInTimeZone } = useFormatDate({})

  const listDevices = Array.isArray(data?.getDeviceUsers)
    ? data?.getDeviceUsers.map((device) => {
      // const formattedDate = formatDateInTimeZone(device.createdAt)
      return {
        ...device
        // createdAt: formattedDate
      }
    })
    : []
  return {
    data: listDevices,
    loading
  }
}
