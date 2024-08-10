import { useQuery } from '@apollo/client'
import { GET_EMPLOYEES } from './queries'

export const useEmployee = () => {
  const {
    data,
    loading,
    error,
    fetchMore
  } = useQuery(GET_EMPLOYEES)
  return [data?.employees?.data ?? [], {
    loading,
    error,
    fetchMore,
    pagination: data?.employees?.pagination
  }]
}
