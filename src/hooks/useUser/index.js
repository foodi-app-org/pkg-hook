import { useQuery, useMutation } from '@apollo/client'
import { GET_USER, SET_USER_PROFILE } from './queries'

export const useUser = () => {
  const { data, loading, error } = useQuery(GET_USER)
  return [data?.getUser, { loading, error }]
}

export const useSetUserProfile = () => {
  const [setUserProfile, { loading, error }] = useMutation(SET_USER_PROFILE)
  return [setUserProfile, { loading, error }]
}