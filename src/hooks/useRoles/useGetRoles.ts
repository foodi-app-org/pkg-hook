import { useQuery, ApolloError } from '@apollo/client'
import { GET_ALL_ROLES } from './queries'
import {
  GetRolesResponse,
  GetRolesVars,
  UseGetRolesParams
} from './useGetRoles.types'

export const useGetRoles = (
  {
    max = 25,
    order = 'DESC',
    search,
    sendNotification = () => {}
  }: UseGetRolesParams = {}
): [
  GetRolesResponse['getRoles'] | undefined,
  {
    loading: boolean
    buttonLoading: boolean
    error?: ApolloError
    refetch: () => void
  }
] => {
  const {
    loading,
    error,
    called,
    data,
    refetch
  } = useQuery<GetRolesResponse, GetRolesVars>(GET_ALL_ROLES, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Algo salió mal',
        backgroundColor: 'error'
      })
    },
    variables: {
      search,
      max,
      order
    }
  })

  return [
    data?.getRoles,
    {
      loading: called ? false : loading,
      buttonLoading: loading,
      error,
      refetch
    }
  ]
}
