import { useMutation } from '@apollo/client'
import type { SendNotificationFn } from 'typesdefs'

import { UPDATE_MULTI_EXTRAS_PRODUCT_FOOD } from './queries'

/**
 * Custom hook para manejar la actualización de múltiples extras de productos alimenticios.
 * @param cleanLines - Función para limpiar líneas después de completar la mutación.
 * @param sendNotification - Función para notificar al usuario.
 * @returns Retorna un array con la función de mutación y el estado de carga.
 */
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

  const [updateMultipleExtProduct, { loading }] = useMutation(UPDATE_MULTI_EXTRAS_PRODUCT_FOOD, {
    onCompleted: (data) => {
      const { updateMultipleExtProduct: result } = data
      const { success, message } = result ?? {}
      sendNotification({
        description: message,
        title: success ? 'Éxito' : 'Error',
        backgroundColor: success ? 'success' : 'error'
      })
      cleanLines()
    }
  })

  return [updateMultipleExtProduct, { loading }]
}
