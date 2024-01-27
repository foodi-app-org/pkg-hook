import { useQuery, gql } from '@apollo/client'

// Define la consulta GraphQL
const GET_MESSAGES = gql`
  query getMessages($codeRoom: String!, $id: String!) {
    getMessages(codeRoom: $codeRoom, id: $id) {
      uuid
      content
      from
      to
      aDatCre
    }
  }
`

export const useGetMessagesToRoom = (codeRoom, id) => {
  const { loading, error, data } = useQuery(GET_MESSAGES, {
    context: { clientName: 'web-socket-chat' },
    variables: { codeRoom, id }
  })

  return [data?.getMessages ?? [], { loading, error }]
}
