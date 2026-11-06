import { useMutation } from '@apollo/client'

import { UPDATE_MULTI_EXTRAS_PRODUCT_FOOD } from './queries'

import type { SendNotificationFn } from 'typesdefs'

type UseUpdateMultipleExtProductParams = {
  cleanLines?: () => void
  sendNotification?: SendNotificationFn
}

export const useUpdateMultipleExtProduct = (
  params?: UseUpdateMultipleExtProductParams
) => {
  const {
    cleanLines = () => {},
    sendNotification = () => {}
  } = params || {}

  const [updateMultipleExtProduct, { loading }] = useMutation(
    UPDATE_MULTI_EXTRAS_PRODUCT_FOOD,
    {
      onCompleted: (data) => {
        const result = data?.updateMultipleExtProduct
        const { success, message } = result ?? {}

        sendNotification({
          description: message || 'La operación ha finalizado.',
          title: success ? 'Éxito' : 'Error',
          backgroundColor: success ? 'success' : 'error'
        })

        cleanLines()
      },

      onError: (error) => {
        const sessionExpired = error.graphQLErrors.some(
          ({ message }) => /session expired/i.test(message)
        )

        sendNotification({
          description: sessionExpired
            ? 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.'
            : error.graphQLErrors[0]?.message || error.message,
          title: 'Error',
          backgroundColor: 'error'
        })
      }
    }
  )

  return [updateMultipleExtProduct, { loading }] as const
}