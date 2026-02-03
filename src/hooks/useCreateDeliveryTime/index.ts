import { useMutation, gql } from '@apollo/client'

import type { SendNotificationFn } from 'typesdefs'

const CREATE_DELIVERY_TIME = gql`
  mutation CreateDeliveryTime($minutes: Int!) {
    createDeliveryTime(minutes: $minutes) {
      success
      message
    }
  }
`


export const useCreateDeliveryTime = ({
  sendNotification
}: { sendNotification?: (params: SendNotificationFn) => void }) => {
  const [createDeliveryTimeMutation, { loading, error }] =
    useMutation(CREATE_DELIVERY_TIME)

  const createDeliveryTime = async (minutes: number) => {
    try {
      if (!minutes) {
        if (sendNotification) {
          sendNotification({
            description: 'The delivery time is required.'
          })
        }
        return
      }
      const { data } = await createDeliveryTimeMutation({
        variables: { minutes: Number.parseInt(minutes.toString()) }
      })
      if (data?.createDeliveryTime?.success) {
        if (sendNotification) {
          sendNotification({
            description: data.createDeliveryTime.message
          })
        }
      }
      // Do not return any value to satisfy consistent-return rule
    } catch {
      if (sendNotification) {
        sendNotification({
          description: 'An error occurred while creating the delivery time.'
        })
      }
    }
  }

  return { createDeliveryTime, loading, error }
}
