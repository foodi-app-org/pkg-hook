import { gql, useQuery } from '@apollo/client'
import { validateModules } from './helpers/validateModules'

const GET_MODULES = gql`
  query GetModules {
    modules {
      mName
      mId
      mPath
      mPriority
      mIcon
      view
      subModules {
        smId
        smName
        smPath
        view
        smState
      }
    }
  }
`

export const useModules = (dataUser = {}) => {
  const { role } = dataUser ?? {
    role: {
      permissions: {}
    }
  }
  const {
    loading,
    error,
    data
  } = useQuery(GET_MODULES)

  const permissions = role?.permissions ?? {}

  const filteredModules = validateModules(data ? data.modules : [], permissions)

  return {
    loading,
    error,
    modules: data ? filteredModules : []
  }
}
