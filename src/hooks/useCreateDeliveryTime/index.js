import { useMutation, gql } from '@apollo/client'

const CREATE_DELIVERY_TIME = gql`
  mutation CreateDeliveryTime($minutes: Int!) {
    createDeliveryTime(minutes: $minutes) {
      success
      message
    }
  }
`

export const useCreateDeliveryTime = ({
  sendNotification = ({ description, title, backgroundColor }) => {
    return { description, title, backgroundColor }
  }
}) => {
  const [createDeliveryTimeMutation, { loading, error }] =
    useMutation(CREATE_DELIVERY_TIME)

  const createDeliveryTime = async (minutes) => {
    try {
      if (!minutes) {
        sendNotification({
          backgroundColor: 'error',
          title: 'Error',
          description: 'The delivery time is required.'
        })
        return
      }
      const { data } = await createDeliveryTimeMutation({
        variables: { minutes: parseInt(minutes) }
      })
      if (data?.createDeliveryTime?.success) {
        sendNotification({
          title: 'Delivery Time Created',
          description: data.createDeliveryTime.message,
          backgroundColor: 'success'
        })
      }
      return data.createDeliveryTime
    } catch (error) {
      sendNotification({
        backgroundColor: 'error',
        title: 'Error',
        description: 'An error occurred while creating the delivery time.'
      })
    }
  }

  return { createDeliveryTime, loading, error }
}
