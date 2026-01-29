import { useMutation } from '@apollo/client'
import { SAVE_LOCATION_USER } from './queries'

export const useSaveLocation = () => {
  const [updateUserLocations, { loading, error, data }] =
    useMutation(SAVE_LOCATION_USER)

  return [
    updateUserLocations,
    {
      loading,
      error,
      data
    }
  ]
}
