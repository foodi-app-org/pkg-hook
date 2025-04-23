import { gql, useMutation } from '@apollo/client'
import { GET_ONE_STORE } from '../useStore/queries'

/**
 * GraphQL mutation to upsert (create or update) the daily goal.
 */
const UPSERT_GOAL = gql`
  mutation UpsertGoal($input: CreateGoalInput!) {
    upsertGoal(input: $input) {
      success
      message
      data {
        idStore
        dailyGoal
      }
    }
  }
`

/**
 * Custom hook to handle the upsert of the daily goal.
 * @param {Object} input - The goal data (e.g. dailyGoal).
 * @returns {{
 *   upsertGoal: (input: { dailyGoal: number }) => void,
 *   data: { success: boolean, message: string, dailyGoal: number } | undefined,
 *   loading: boolean,
 *   error: any
 * }}
 */
export const useUpsertGoal = ({
  sendNotification = () => {}
} = {}) => {
  const [upsertGoalMutation, { data, loading, error }] = useMutation(UPSERT_GOAL, {
    onCompleted (data) {
      const { upsertGoal } = data || {}
      sendNotification({
        title: upsertGoal.success ? 'Exito' : 'Error',
        description: upsertGoal?.message || 'Meta actualizada correctamente',
        backgroundColor: upsertGoal.success ? 'success' : 'warning'
      })
    },
    update (cache, { data: { upsertGoal } }) {
      if (!upsertGoal?.success) return

      cache.modify({
        fields: {
          getStore (dataOld = []) {
            return cache.writeQuery({
              query: GET_ONE_STORE,
              data: dataOld
            })
          }
        }
      })
    }
  })
  const upsertGoal = (input) => {
    upsertGoalMutation({
      variables: { input }
    })
  }

  return [upsertGoal, {
    data: data?.upsertGoal,
    loading,
    error
  }]
}
