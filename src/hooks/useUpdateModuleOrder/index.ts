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

interface ModuleOrderInput {
  mId: string | number
  mPriority: number
}

export const useUpdateModuleOrder = () => {
  const [updateModuleOrderMutation] = useMutation(UPDATE_MODULE_ORDER)

  const updateModulesOrder = useCallback(async (newOrder: ModuleOrderInput[]) => {
    // Enviar la actualización a la API (GraphQL)
    try {
      await updateModuleOrderMutation({
        variables: { input: newOrder.map(({ mId, mPriority }: ModuleOrderInput) => { return { mId, mPriority } }) },
        // Keep the navigation query in sync with the backend after saving.
        // The server is the source of truth for the order (it returns modules
        // sorted by `mPriority`), so we refetch `GetModules` and wait for it to
        // land before resolving. This prevents the UI from drifting back to the
        // old order on a later reload if the local optimistic state is lost.
        refetchQueries: ['GetModules'],
        awaitRefetchQueries: true
      })
    } catch (error) {
      console.error('Error updating module order:', error)
      throw new Error('Failed to update module order')
    }
  }, [updateModuleOrderMutation])

  return [updateModulesOrder]
}
