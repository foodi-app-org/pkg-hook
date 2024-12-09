import { useEffect, useState } from 'react'
import { gql, useQuery } from '@apollo/client'

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

export const useSubscriptionValidation = (idStore) => {
  const { loading, error, data } = useQuery(VALIDATE_SUBSCRIPTION_QUERY, {
    variables: { idStore }
  })
  const [daysRemaining, setDaysRemaining] = useState(null)
  const [daysElapsed, setDaysElapsed] = useState(null)

  useEffect(() => {
    if (data && data.validateFreeSubscription) {
      const { currentPeriodEnd, currentPeriodStart } = data.validateFreeSubscription
      const currentDate = new Date()
      const endOfPeriod = new Date(parseInt(currentPeriodEnd))
      const startOfPeriod = new Date(parseInt(currentPeriodStart))

      const differenceInTimeUntilEnd = endOfPeriod.getTime() - currentDate.getTime()
      const differenceInDaysUntilEnd = Math.ceil(differenceInTimeUntilEnd / (1000 * 3600 * 24))
      setDaysRemaining(isNaN(differenceInDaysUntilEnd) ? 0 : differenceInDaysUntilEnd)

      const differenceInTimeSinceStart = currentDate.getTime() - startOfPeriod.getTime()
      const differenceInDaysSinceStart = Math.ceil(differenceInTimeSinceStart / (1000 * 3600 * 24))
      setDaysElapsed(isNaN(differenceInDaysSinceStart) ? 0 : differenceInDaysSinceStart)
    }
  }, [data])

  return { loading, error, subscriptionData: data?.validateFreeSubscription, daysRemaining, daysElapsed }
}
