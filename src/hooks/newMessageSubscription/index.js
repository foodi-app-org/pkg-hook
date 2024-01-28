import { useSubscription, gql } from '@apollo/client'

const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription NewMessage($idStore: String!) {
    newMessage(idStore: $idStore) {
      uuid
      content
      aDatCre
      from
      to
    }
  }
`

export const newMessageSubscription = (idStore, onMessageReceived) => {
  const subscription = useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { idStore },
    onSubscriptionData: ({ client, subscriptionData }) => {
      if (subscriptionData.data && subscriptionData.data.newMessage) {
        // Llama a la función proporcionada cuando se recibe un nuevo mensaje
        onMessageReceived(subscriptionData.data.newMessage)
      }
    }
  })

  // Puedes ajustar lo que devuelve el hook según tus necesidades
  return subscription
}
