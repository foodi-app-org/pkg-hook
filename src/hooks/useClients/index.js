import { useQuery } from '@apollo/client'
import { useState } from 'react'
import { GET_ALL_CLIENTS } from './queries'

export const useGetClients = () => {
    const [clientes, setClients] = useState([])
    const { loading, error } = useQuery(GET_ALL_CLIENTS, {
    onCompleted: (data) => {
        setClients(data)
    }
  })
  return [clientes?.getAllClients || [], { loading, error }]
}

export const useDeleteClients = () => {
    const [clientes, setClients] = useState([])
    const { loading, error } = useQuery(GET_ALL_CLIENTS, {
    onCompleted: (data) => {
        setClients(data)
    }
  })
  return [clientes?.getAllClients || [], { loading, error }]
}
