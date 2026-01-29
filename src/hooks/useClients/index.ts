import {
  useQuery,
  useMutation,
  useLazyQuery
} from '@apollo/client'
import {
  CREATE_CLIENTS,
  DELETE_ONE_CLIENTS,
  GET_ALL_CLIENTS,
  GET_ONE_CLIENT,
  EDIT_ONE_CLIENT
} from './queries'

export const useGetClients = ({
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
  } = useQuery(GET_ALL_CLIENTS, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Algo salió mal',
        backgroundColor: 'error'
      })
    },
    variables: {
      search,
      max: max || 100,
      order
    }
  })
  return [data?.getAllClients || [], {
    loading: called ? false : loading,
    buttonLoading: loading,
    error,
    refetch
  }]
}

export const useDeleteClients = ({ sendNotification = () => { } } = {}) => {
  const [deleteClient, { loading, error }] = useMutation(DELETE_ONE_CLIENTS)
  return [deleteClient, { loading, error }]
}

export const useCreateClient = ({ sendNotification = () => { } } = {}) => {
  const [createClients, { loading, error }] = useMutation(CREATE_CLIENTS, {
    onError: (data) => {
      sendNotification({
        title: '',
        description: 'Error',
        backgroundColor: 'error'
      })
    }
  })

  return [createClients || [], { loading, error }]
}

export const useEditClient = ({ sendNotification = () => { } } = {}) => {
  const [editOneClient, { loading, error, data }] = useMutation(EDIT_ONE_CLIENT, {
    onCompleted: (data) => {
      if (data?.editOneClient?.success) {
        return sendNotification({
          title: 'Éxito',
          description: data?.editOneClient?.message,
          backgroundColor: 'success'
        })
      }
    },
    onError: (data) => {
      if (data?.editOneClient) {
        return sendNotification({
          title: 'Error',
          description: data?.editOneClient?.message,
          backgroundColor: 'error'
        })
      }
    }
  })

  return [editOneClient, { loading, error, data }]
}

export const useGetOneClient = ({ sendNotification = () => { } } = {}) => {
  const [getOneClients, { data, loading, error }] = useLazyQuery(GET_ONE_CLIENT)

  return [getOneClients || [], { loading, error, data }]
}
