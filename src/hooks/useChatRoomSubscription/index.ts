import {
  useSubscription,
  gql,
  SubscriptionResult
} from '@apollo/client'

/* ---------- GraphQL ---------- */

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

/* ---------- Types ---------- */

/**
 * Chat room message shape
 */
export type ChatRoomMessage = {
  uuid: string
  content: string
  aDatCre: string
  from: string
  to: string
}

/**
 * Subscription response
 */
type NewChatRoomMessageResponse = {
  newChatRoomMessage?: ChatRoomMessage
}

/**
 * Subscription variables
 */
type NewChatRoomMessageVars = {
  codeRoom: string
}

/**
 * Callback invoked when a new message is received
 */
type OnMessageReceived = (message: ChatRoomMessage) => void

/* ---------- Hook ---------- */

/**
 * Chat room subscription hook
 * @param codeRoom
 * @param onMessageReceived
 * @returns {SubscriptionResult<NewChatRoomMessageResponse>} Subscription result
 */
export const chatRoomSubscription = (
  codeRoom: string,
  onMessageReceived: OnMessageReceived
): SubscriptionResult<NewChatRoomMessageResponse> => {
  const subscription = useSubscription<
    NewChatRoomMessageResponse,
    NewChatRoomMessageVars
  >(NEW_CHAT_ROOM_MESSAGE_SUBSCRIPTION, {
    variables: { codeRoom },
    onSubscriptionData: ({ subscriptionData }) => {
      const message = subscriptionData.data?.newChatRoomMessage
      if (message) {
        onMessageReceived(message)
      }
    }
  })

  return subscription
}
