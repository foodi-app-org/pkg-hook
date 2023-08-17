import { useQuery } from '@apollo/client'
import { GET_EMPLOYEES } from './queries'

export const useEmployee = () => {
  const { data, loading, error, fetchMore } = useQuery(GET_EMPLOYEES, {
    onError: (error) => {
      console.error(error)
    }
  })
  const employees = data?.employees || []
  return [employees, { 
    loading, 
    error,
    fetchMore
  }]
}
