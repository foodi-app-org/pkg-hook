
import { gql, useMutation } from '@apollo/client'

import type { SendNotificationFn } from 'typesdefs'

type CreateDeliveryTimeResult = {
    success: boolean
    message: string
}

type CreateDeliveryTimeData = {
    createDeliveryTime: CreateDeliveryTimeResult
}

type CreateDeliveryTimeVariables = {
    minutes: number
}

const CREATE_DELIVERY_TIME = gql`
    mutation CreateDeliveryTime($minutes: Int!) {
        createDeliveryTime(minutes: $minutes) {
            success
            message
        }
    }
`

type UseCreateDeliveryTimeOptions = {
    sendNotification?: SendNotificationFn
}

export const useCreateDeliveryTime = ({
    sendNotification = () => {}
}: UseCreateDeliveryTimeOptions = {}) => {

    const [
        createDeliveryTimeMutation,
        { loading, error }
    ] = useMutation<
        CreateDeliveryTimeData,
        CreateDeliveryTimeVariables
    >(CREATE_DELIVERY_TIME, {
        update(cache, { data, variables }) {
            const result = data?.createDeliveryTime

            if (!result?.success || !variables) return

            const deliveryTimeMinutes = variables.minutes

            /**
             * Localiza todas las entidades Store normalizadas.
             */
            const normalizedCache = cache.extract()

            const storeCacheIds = Object.entries(normalizedCache)
                .filter(([, value]) => {
                    if (!value || typeof value !== 'object') {
                        return false
                    }

                    const store = value as Record<string, unknown>

                    return store.__typename === 'Store'
                })
                .map(([cacheId]) => cacheId)

            /**
             * Modifica exclusivamente deliveryTimeMinutes.
             */
            storeCacheIds.forEach((cacheId) => {
                cache.modify({
                    id: cacheId,
                    fields: {
                        deliveryTimeMinutes() {
                            return deliveryTimeMinutes
                        }
                    }
                })
            })
        }
    })

    const createDeliveryTime = async (minutes: number): Promise<void> => {
        if (
            !Number.isInteger(minutes) ||
            minutes < 1 ||
            minutes > 60
        ) {
            sendNotification({
              description: 'El tiempo de entrega debe estar entre 1 y 60 minutos.',
              title: '',
              backgroundColor: ''
            })
            return
        }

        try {
            const { data } = await createDeliveryTimeMutation({
                variables: {
                    minutes
                }
            })

            const result = data?.createDeliveryTime

            sendNotification({
              description: result?.message ||
                'An error occurred while creating the delivery time.',
              title: '',
              backgroundColor: ''
            })

        } catch {
            sendNotification({
              description: 'An error occurred while creating the delivery time.',
              title: '',
              backgroundColor: ''
            })
        }
    }

    return {
        createDeliveryTime,
        loading,
        error
    }
}
