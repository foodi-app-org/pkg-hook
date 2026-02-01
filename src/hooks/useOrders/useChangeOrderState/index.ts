import { gql, useMutation } from '@apollo/client'

import { SendNotificationFn } from '../../useImageUploaderProduct'
/**
 * GraphQL mutation to change the state of a store order (pedido).
 */
const CHANGE_STATE_STORE_ORDER = gql`
  mutation changePPStateOrder($idStatus: ID, $pCodeRef: String, $pDatMod: String) {
    changePPStateOrder(idStatus: $idStatus, pCodeRef: $pCodeRef, pDatMod: $pDatMod) {
      success
      message
      errors {
        path
        message
        type
      }
      data {
        pdpId
        id
        idStore
        pPStateP
        pSState
        
        ppState
        pCodeRef
      }
    }
  }
`

interface IUseChangeStateOrder {
    sendNotification: SendNotificationFn
}
/**
 * Hook to trigger the `changePPStateOrder` mutation.
 * @param root0
 * @param root0.sendNotification
 * @returns {Object} Contains the mutation function, loading and error state.
 */
export const useChangeStateOrder = ({
  sendNotification
}: IUseChangeStateOrder) => {

  const [changeState, { loading, error, data }] = useMutation(CHANGE_STATE_STORE_ORDER, {
    onCompleted: (res) => {
      if (!res || !res.changePPStateOrder) {
        return
      }
      const { success, data } = res?.changePPStateOrder || {}
      if (success) {
        const { pCodeRef, pSState } = data ?? {
          pCodeRef: null,
          pSState: null
        }
        if (!pCodeRef || !pSState) {
          return
        }
        // client.cache.modify({
        //     fields: {
        //         getAllOrdersFromStore(existingOrders = []) {
        //             try {
        //                 // return 
        //                 console.log({ cache: updateExistingOrders(existingOrders, pCodeRef, pSState) })
        //             } catch (e) {
        //                 return existingOrders
        //             }
        //         }
        //     }
        // })
      }
    }
  })

  /**
   * Triggers the mutation to update the pedido state.
   * @param {Object} params
   * @param {number} params.idStatus - New state of the pedido (required).
   * @param {string} params.pCodeRef - Reference code for the pedido (required).
   * @param {string} params.pDatMod - Modification date in ISO format (required).
   * @returns {Promise<Object>} Response from the mutation.
   */
  const changeStateOrder = async ({
    idStatus,
    pCodeRef,
    pDatMod
  }: {
        idStatus: string
        pCodeRef: string
        pDatMod: string
    }) => {
    try {
      const response = await changeState({
        variables:
                {
                  idStatus,
                  pCodeRef,
                  pDatMod
                }
      })
      const { success, message } = response?.data?.changePPStateOrder ?? {
        success: false,
        message: ''
      }
      sendNotification({
        title: success ? 'Exitoso' : 'Error',
        description: message,
        backgroundColor: success ? 'success' : 'error'
      })
      return response?.data?.changePPStateOrder ?? {
        success: false,
        message
      }
    } catch (err) {
      return {
        success: false,
        message: typeof err === 'object' && err !== null && 'message' in err && typeof (err as any).message === 'string'
          ? (err as any).message
          : 'Unexpected error occurred'
      }
    }
  }

  return [changeStateOrder, {
    loading,
    error,
    data
  }]
}
