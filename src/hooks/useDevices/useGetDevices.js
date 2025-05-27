import { useQuery } from '@apollo/client'
import { GET_ALL_DEVICES } from './queries'
import { useFormatDate } from '../useFormatDate'

export const useDevices = () => {
  const { data, loading } = useQuery(GET_ALL_DEVICES, {
    onError: (error) => {
      console.error(error)
    }
  })

  // Función para formatear la fecha
  const { formatDateInTimeZone } = useFormatDate({})

  const listDevices = Array.isArray(data?.getDeviceUsers) ? data?.getDeviceUsers.map((device) => {
    const formattedDate = formatDateInTimeZone(device.DatCre)
    return {
      ...device,
      DatCre: formattedDate
    }
  }) : []
  return {
    data: listDevices,
    loading
  }
}
