import { useSubscription, gql } from '@apollo/client'

export const NEW_STORE_ORDER_SUBSCRIPTION = gql`
  subscription NewStoreOrder($idStore: String!) {
    newStoreOrder(idStore: $idStore) {
      id
      idStore
      pCodeRef
    }
  }
`

export interface NewStoreOrder {
  id: string
  idStore: string
  pCodeRef: string
}

interface SubscriptionData {
  newStoreOrder: NewStoreOrder
}

interface SubscriptionVariables {
  idStore: string
}

export const useNewStoreOrderSubscription = (
  idStore: string,
  onOrderReceived: (order: NewStoreOrder) => void
) => {
  return useSubscription<
    SubscriptionData,
    SubscriptionVariables
  >(NEW_STORE_ORDER_SUBSCRIPTION, {
    variables: {
      idStore
    },

    context: {
      clientName: 'BACKEND_REALTIME'
    },

    skip: !idStore,

    fetchPolicy: 'no-cache',

    onData: ({ data }) => {
      const order = data.data?.newStoreOrder
    
      console.debug('[NewStoreOrder] Received', order)

      onOrderReceived(order)
    },

    onError: error => {
      console.error('[NewStoreOrder] Subscription error', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError
      })
    },

    onComplete: () => {
      console.info('[NewStoreOrder] Completed')
    }
  })
}

// Backward compatibility.
export const newStoreOrderSubscription =
  useNewStoreOrderSubscription