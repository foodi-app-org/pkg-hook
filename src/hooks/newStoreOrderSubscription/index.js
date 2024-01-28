import { useSubscription, gql } from '@apollo/client'

const NEW_STORE_ORDER_SUBSCRIPTION = gql`
  subscription NewStoreOrder($idStore: String!) {
    newStoreOrder(idStore: $idStore) {
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

export const newStoreOrderSubscription = (idStore, onOrderReceived) => {
  const subscription = useSubscription(NEW_STORE_ORDER_SUBSCRIPTION, {
    variables: { idStore },
    onSubscriptionData: ({ client, subscriptionData }) => {
      if (subscriptionData.data && subscriptionData.data.newStoreOrder) {
        // Llama a la función proporcionada cuando se recibe una nueva orden
        onOrderReceived(subscriptionData.data.newStoreOrder)
      }
    }
  })

  // Puedes ajustar lo que devuelve el hook según tus necesidades
  return subscription
}
