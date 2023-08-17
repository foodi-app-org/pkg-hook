import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import {
  CREATE_CLIENTS,
  DELETE_ONE_CLIENTS,
  GET_ALL_CLIENTS,
  GET_ONE_CLIENT,
  EDIT_ONE_CLIENT
} from './queries'

export const useGetClients = ({
  max,
  search,
  fromDate, // Agrega las variables fromDate y toDate
  toDate,
  sendNotification = () => { return }
} = {}) => {
  const { 
    loading, 
    error, 
    called, 
    data
  } = useQuery(GET_ALL_CLIENTS, {
    variables: {
      search: search,
      fromDate: fromDate, // Usa las variables aquí
      toDate: toDate
    }
  });

  return [data?.getAllClients || [], { loading: called ? false : loading, error }];
};

export const useDeleteClients = ({ sendNotification = () => { return } } = {}) => {
  const [deleteClient, {  loading, error }] = useMutation(DELETE_ONE_CLIENTS)
  return [deleteClient, { loading, error }]
}

export const useCreateClient = ({ sendNotification = () => { return } } = {}) => {
  const [createClients, { loading, error }] = useMutation(CREATE_CLIENTS, {
    onError: (data) => {
      // sendNotification({
      //   title:  '',
      //   description: 'Error',
      //   backgroundColor: 'error'
      // })
    }
  })

  return [createClients || [], { loading, error }]
}

export const useEditClient = ({ sendNotification = () => { return } } = {}) => {
  const [editOneClient, { loading, error, data }] = useMutation(EDIT_ONE_CLIENT, {
    onCompleted: (data) => {
      console.log(data)
      if (data?.editOneClient?.success) {
        return sendNotification({
          title:  'Exito',
          description: data?.editOneClient?.message,
          backgroundColor: 'success'
        })
      }
    },
    onError: (data) => {
      if (data?.editOneClient) {
        return sendNotification({
          title:  'Error',
          description: data?.editOneClient?.message,
          backgroundColor: 'error'
        })
      }
    }
  })

  return [editOneClient, { loading, error, data }]
}

export const useGetOneClient = ({ sendNotification = () => { return } } = {}) => {
  const [getOneClients, { data, loading, error }] = useLazyQuery(GET_ONE_CLIENT)

  return [getOneClients || [], { loading, error, data }]
}
