
import { useSubscription, gql } from '@apollo/client'

const NEW_STORE_ORDER_SUBSCRIPTION = gql`
 subscription StockUpdatedAll($idStore: String) {
    StockUpdatedAll(idStore: $idStore) {
      pId
      newStock
      previousStock
      event
      meta
    }
  } 
`

interface StockUpdatedAllData {
    StockUpdatedAll: {
        pId: string
        newStock: number
        previousStock: number
        event: string
        meta: any
    }
}

export const useStockUpdatedAllSubscription = (
  idStore: string,
  onStockUpdated: (data: StockUpdatedAllData['StockUpdatedAll']) => void
) => {
  return useSubscription<StockUpdatedAllData>(NEW_STORE_ORDER_SUBSCRIPTION, {
    variables: { idStore },
    skip: !idStore,
    onSubscriptionData: ({ subscriptionData }) => {
      const data = subscriptionData.data?.StockUpdatedAll
      if (!data) return
      onStockUpdated(data)
    }
  })
}

