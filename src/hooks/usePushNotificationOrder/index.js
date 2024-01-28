import { useMutation, gql } from '@apollo/client'

// Define el mutation GraphQL
const PUSH_NOTIFICATION_ORDER = gql`
  mutation PushNotificationOrder($pCodeRef: String!, $idStore: ID!) {
    pushNotificationOrder(pCodeRef: $pCodeRef, idStore: $idStore) {
      pdpId
      id
      idStore
      pId
      ppState
      pCodeRef
      pPDate
      pSState
      pPStateP
      payMethodPState
      pPRecoger
      totalProductsPrice
      unidProducts
      pDatCre
      pDatMod
    }
  }
`

// Definir el hook personalizado
export const usePushNotificationOrder = ({ client }) => {
  // Usar el hook useMutation para ejecutar el mutation
  const [pushNotificationOrderMutation] = useMutation(PUSH_NOTIFICATION_ORDER, {
    context: { clientName: client }
  })

  // Función para ejecutar el mutation
  const pushNotificationOrder = async (pCodeRef, idStore) => {
    try {
      // Ejecutar el mutation con los parámetros proporcionados
      const { data } = await pushNotificationOrderMutation({
        variables: { pCodeRef, idStore }
      })

      // Devolver los datos de la orden recibidos del servidor
      return data.pushNotificationOrder
    } catch (error) {
      // Manejar cualquier error que ocurra durante la ejecución del mutation
      console.error('Error al ejecutar el mutation pushNotificationOrder:', error)
      throw new Error('Error al publicar la nueva orden de tienda. Por favor, vuelve a intentarlo.')
    }
  }

  // Devolver la función pushNotificationOrder para ser utilizada por el componente
  return pushNotificationOrder
}
