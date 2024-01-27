import { useSubscription, gql } from '@apollo/client'

const NEW_CHAT_ROOM_MESSAGE_SUBSCRIPTION = gql`
  subscription NewChatRoomMessage($codeRoom: String!) {
    newChatRoomMessage(codeRoom: $codeRoom) {
      uuid
      content
      aDatCre
      from
      to
    }
  }
`

export const chatRoomSubscription = (codeRoom, onMessageReceived) => {
  const subscription = useSubscription(NEW_CHAT_ROOM_MESSAGE_SUBSCRIPTION, {
    variables: { codeRoom },
    onSubscriptionData: ({ client, subscriptionData }) => {
      if (subscriptionData.data && subscriptionData.data.newChatRoomMessage) {
        // Llama a la función proporcionada cuando se recibe un nuevo mensaje
        onMessageReceived(subscriptionData.data.newChatRoomMessage)
      }
    }
  })

  // Puedes ajustar lo que devuelve el hook según tus necesidades
  return subscription
}
