import { gql, useMutation } from '@apollo/client'
import { useCallback } from 'react'

const UPDATE_MODULE_ORDER = gql`
  mutation UpdateModuleOrder($input: [UpdateModuleOrderInput]!) {
    updateModuleOrder(input: $input) {
      success
      message
      modules {
        mId
        mPriority
      }
     errors {
      path
      message
    }
    }
  }
`

export const useUpdateModuleOrder = () => {
  const [updateModuleOrderMutation] = useMutation(UPDATE_MODULE_ORDER)

  const updateModulesOrder = useCallback(async (newOrder) => {
    // Enviar la actualización a la API (GraphQL)
    try {
      await updateModuleOrderMutation({
        variables: { input: newOrder.map(({ mId, mPriority }) => {return { mId, mPriority }}) }
      })
    } catch (error) {
      console.error('Error updating module order:', error)
      throw new Error('Failed to update module order')
    }
  }, [updateModuleOrderMutation])

  return [updateModulesOrder]
}
