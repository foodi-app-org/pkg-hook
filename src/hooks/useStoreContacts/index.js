import { useQuery, useMutation, useLazyQuery } from '@apollo/client'
import { useState } from 'react'
import {
  GET_ALL_CONTACTS,
  EDIT_ONE_CONTACT,
  CREATE_CONTACTS,
  GET_ONE_CONTACT
} from './queries'

export const useGetStoreContacts = ({
  sendNotification = () => { },
  max,
  search = ''
} = {}) => {
  const [clientes, setUseStoreContacts] = useState([])
  const { loading, error, fetchMore, called } = useQuery(GET_ALL_CONTACTS, {
    variables: {
      max,
      search
    },
    onCompleted: (data) => {
      setUseStoreContacts(data)
    }
  })
  return [clientes?.getAllContacts || [], { loading: called ? false : loading, error, fetchMore }]
}

export const useDeleteUseStoreContacts = ({ sendNotification = () => { } } = {}) => {
  const [getOneContacts, { data, error, loading }] = useLazyQuery(GET_ONE_CONTACT)
  return [getOneContacts, data?.getOneContacts ?? {}, { loading, error }]
}

export const useGetOneUseStoreContacts = ({ sendNotification = () => { } } = {}) => {
  const [getOneContacts, { data, error, loading }] = useLazyQuery(GET_ONE_CONTACT)
  return [getOneContacts, { data: data?.getOneContacts, loading, error }]
}

export const useEditOneUseStoreContacts = ({ sendNotification = () => { } } = {}) => {
  const [editOneContacts, { data, error, loading }] = useMutation(EDIT_ONE_CONTACT)
  return [editOneContacts, { data: data?.editOneContacts, loading, error }]
}

export const useCreateContacts = ({ sendNotification = () => { } } = {}) => {
  const [createUseStoreContacts, { loading, error }] = useMutation(CREATE_CONTACTS)

  return [createUseStoreContacts, { loading, error }]
}
