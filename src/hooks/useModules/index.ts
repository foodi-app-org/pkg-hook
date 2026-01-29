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
        smIcon
        smState
      }
    }
  }
`

export const useModules = ({
  dataUser = {},
  callback = () => {}
}) => {
  const { role } = dataUser ?? {
    role: {
      permissions: {}
    }
  }
  const {
    loading,
    error,
    data
  } = useQuery(GET_MODULES, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (Array.isArray(data?.modules)) {
        callback(data.modules)
      }
    },
    onError: (error) => {
      console.error('Error fetching modules:', error)
    }
  })

  const permissions = role?.permissions ?? {}

  const filteredModules = validateModules(data ? data.modules : [], permissions)

  return {
    loading,
    error,
    modules: data ? filteredModules : []
  }
}
