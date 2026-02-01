import { useMutation, useQuery } from '@apollo/client'

import { GET_USER, GET_USER_PROFILE, SET_USER_PROFILE } from './queries'

export const useUser = (email: string) => {
  const { data, loading, error } = useQuery(GET_USER, email !== ''
    ? {
      variables: {
        email
      }
    }
    : {})
  return [data?.getUser, { loading, error }]
}

export const useUserProfile = () => {
  const { data, loading, error } = useQuery(GET_USER_PROFILE)
  return [data, { loading, error }]
}

export const useSetUserProfile = () => {
  const [setUserProfile, { loading, error }] = useMutation(SET_USER_PROFILE)
  return [setUserProfile, { loading, error }]
}
