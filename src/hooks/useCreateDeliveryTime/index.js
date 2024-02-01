import { useMutation, gql } from '@apollo/client'

const CREATE_DELIVERY_TIME = gql`
  mutation CreateDeliveryTime($minutes: Int!) {
    createDeliveryTime(minutes: $minutes) {
      success
      message
    }
  }
`

export const useCreateDeliveryTime = () => {
  const [createDeliveryTimeMutation, { loading, error }] = useMutation(CREATE_DELIVERY_TIME)

  const createDeliveryTime = async (minutes) => {
    try {
      const { data } = await createDeliveryTimeMutation({ variables: { minutes } })
      return data.createDeliveryTime
    } catch (error) {
      console.error('Error creating delivery time:', error)
      return { success: false, message: 'An error occurred while creating delivery time' }
    }
  }

  return { createDeliveryTime, loading, error }
}
