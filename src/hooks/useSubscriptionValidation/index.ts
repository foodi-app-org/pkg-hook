import { gql, useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

/**
 * GraphQL query to validate free subscription
 */
const VALIDATE_SUBSCRIPTION_QUERY = gql`
  query validateFreeSubscription($idStore: ID) {
    validateFreeSubscription(idStore: $idStore) {
      subscriptionId
      status
      businessName
      currentPeriodEnd
      currentPeriodStart
    }
  }
`

/**
 * Subscription entity returned by the API
 */
export interface SubscriptionData {
  subscriptionId: string
  status: string
  businessName: string
  currentPeriodEnd: string
  currentPeriodStart: string
}

/**
 * GraphQL query response shape
 */
interface ValidateSubscriptionResponse {
  validateFreeSubscription: SubscriptionData
}

/**
 * Hook return type
 */
export interface UseSubscriptionValidationResult {
  loading: boolean
  error?: Error
  subscriptionData?: SubscriptionData
  daysRemaining: number | null
  daysElapsed: number | null
}

/**
 * Hook to validate store subscription and calculate elapsed/remaining days.
 * Keeps original behavior and calculations intact.
 *
 * @param {string} idStore - Store identifier
 * @returns {UseSubscriptionValidationResult}
 */
export const useSubscriptionValidation = (
  idStore: string
): UseSubscriptionValidationResult => {
  const { loading, error, data } = useQuery<ValidateSubscriptionResponse>(
    VALIDATE_SUBSCRIPTION_QUERY,
    {
      variables: { idStore }
    }
  )

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [daysElapsed, setDaysElapsed] = useState<number | null>(null)

  useEffect(() => {
    if (data?.validateFreeSubscription) {
      const { currentPeriodEnd, currentPeriodStart } =
        data.validateFreeSubscription

      const currentDate = new Date()
      const endOfPeriod = new Date(Number.parseInt(currentPeriodEnd, 10))
      const startOfPeriod = new Date(Number.parseInt(currentPeriodStart, 10))

      const differenceInTimeUntilEnd =
        endOfPeriod.getTime() - currentDate.getTime()

      const differenceInDaysUntilEnd = Math.ceil(
        differenceInTimeUntilEnd / (1000 * 3600 * 24)
      )

      setDaysRemaining(
        Number.isNaN(differenceInDaysUntilEnd)
          ? 0
          : differenceInDaysUntilEnd
      )

      const differenceInTimeSinceStart =
        currentDate.getTime() - startOfPeriod.getTime()

      const differenceInDaysSinceStart = Math.ceil(
        differenceInTimeSinceStart / (1000 * 3600 * 24)
      )

      setDaysElapsed(
        Number.isNaN(differenceInDaysSinceStart)
          ? 0
          : differenceInDaysSinceStart
      )
    }
  }, [data])

  return {
    loading,
    error: error ?? undefined,
    subscriptionData: data?.validateFreeSubscription,
    daysRemaining,
    daysElapsed
  }
}
