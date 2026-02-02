import { gql, useMutation } from '@apollo/client'
import type { SendNotificationFn } from 'typesdefs'

// Define UpsertGoalInput type if not imported from elsewhere
/**
 * @typedef {Object} UpsertGoalInput
 * @property {string} idStore
 * @property {number} dailyGoal
 */
type UpsertGoalInput = {
  idStore: string
  dailyGoal: number
}

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

type UpsertGoalData = {
  success: boolean
  message: string
  data: { idStore: string; dailyGoal: number }
}
type UseUpsertGoalOptions = {
  sendNotification?: SendNotificationFn
}

export const useUpsertGoal = ({
  sendNotification = () => {}
}: UseUpsertGoalOptions = {}) => {
  const [upsertGoalMutation, { data, loading }] = useMutation<{ upsertGoal: UpsertGoalData }, { input: UpsertGoalInput }>(UPSERT_GOAL, {
    onCompleted(data) {
      const { upsertGoal } = data || {}
        sendNotification({
          title: upsertGoal?.success ? 'Éxito' : 'Error',
          description: upsertGoal?.message || 'Meta actualizada correctamente',
          backgroundColor: upsertGoal?.success ? 'success' : 'warning'
        })
    },
    update(cache, { data }) {
      const upsertGoal = data?.upsertGoal;
      if (!upsertGoal?.success) return

      cache.modify({
        fields: {
          getStore(dataOld = []) {
            return {
              ...dataOld,
              dailyGoal: upsertGoal.data.dailyGoal
            }
          }
        }
      })
    }
  })
  const upsertGoal = (input: UpsertGoalInput) => {
    upsertGoalMutation({
      variables: { input }
    })
  }

  return [
    upsertGoal,
    {
      data: data?.upsertGoal,
      loading
    }
  ] as [
    (input: UpsertGoalInput) => void,
    {
      data: UpsertGoalData | undefined
      loading: boolean
    }
  ]
}
