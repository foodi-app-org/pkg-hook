import { useQuery } from '@apollo/client'

import { GET_ALL_ROLES } from './queries'

export const useGetRoles = ({
  max,
  order = 'DESC',
  search,
  sendNotification = () => { }
} = {}) => {
  const {
    loading,
    error,
    called,
    data,
    refetch
  } = useQuery(GET_ALL_ROLES, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Algo salió mal',
        backgroundColor: 'error'
      })
    },
    variables: {
      search,
      max: max || 25,
      order
    }
  })
  return [data?.getRoles, {
    loading: called ? false : loading,
    buttonLoading: loading,
    error,
    refetch
  }]
}
