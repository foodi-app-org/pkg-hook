import { 
  useQuery, 
  useMutation, 
  useLazyQuery
} from '@apollo/client'
import { useState } from 'react'

import {
  GET_ALL_CONTACTS,
  EDIT_ONE_CONTACT,
  CREATE_CONTACTS,
  GET_ONE_CONTACT
} from './queries'

import type { SendNotificationFn } from 'typesdefs'


interface UseStoreContactsParams {
  sendNotification?: SendNotificationFn
  max?: number
  search?: string
}
// Define a type for Contact based on your GraphQL schema
interface Contact {
  contactId: string
  cntState: string
  cntComments: string
  cntNumberPhone: string
  cntName: string
  createAt: string
  updateAt: string
}

export const useGetStoreContacts = ({
  max,
  search = ''
}: UseStoreContactsParams = {}) => {
  const [clientes, setClientes] = useState<{ getAllContacts?: Contact[] } | undefined>(undefined)
  const { loading, error, fetchMore, called } = useQuery(GET_ALL_CONTACTS, {
    variables: {
      max,
      search
    },
    onCompleted: (data) => {
      setClientes(data)
    }
  })
  return [clientes?.getAllContacts ?? [], { loading: called ? false : loading, error, fetchMore }]
}

export const useDeleteUseStoreContacts = () => {
  const [getOneContacts, { data, error, loading }] = useLazyQuery(GET_ONE_CONTACT)
  return [getOneContacts, data?.getOneContacts ?? {}, { loading, error }]
}

export const useGetOneUseStoreContacts = () => {
  const [getOneContacts, { data, error, loading }] = useLazyQuery(GET_ONE_CONTACT)
  return [getOneContacts, { data: data?.getOneContacts, loading, error }]
}

export const useEditOneUseStoreContacts = () => {
  const [editOneContacts, { data, error, loading }] = useMutation(EDIT_ONE_CONTACT)
  return [editOneContacts, { data: data?.editOneContacts, loading, error }]
}

export const useCreateContacts = () => {
  const [createUseStoreContacts, { loading, error }] = useMutation(CREATE_CONTACTS)

  return [createUseStoreContacts, { loading, error }]
}
