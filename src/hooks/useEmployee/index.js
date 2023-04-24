import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { GET_EMPLOYEES } from './queries'

export const useEmployee = () => {
  const [clientes, setClients] = useState([])
  const [more, setMore] = useState(100)
  const { data, loading, error, fetchMore } = useQuery(GET_EMPLOYEES)
  useEffect(() => {
    setClients(data)
  }, [clientes, data])
  return [clientes?.employees, { loading, error, fetchMore, setMore, more }]
}
