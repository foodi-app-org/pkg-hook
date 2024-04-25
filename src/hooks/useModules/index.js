import { gql, useQuery } from '@apollo/client'

const GET_MODULES = gql`
  query GetModules {
    modules {
      mName
      mId
      mPath
      mPriority
      mIcon
      subModules {
        smId
        smName
        smPath
        smState
      }
    }
  }
`

export const useModules = () => {
  const { loading, error, data } = useQuery(GET_MODULES)

  return {
    loading,
    error,
    modules: data ? data.modules : []
  }
}
