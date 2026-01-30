import { gql, useQuery } from '@apollo/client'

import { validateModules } from './helpers/validateModules'

/**
 * GraphQL query to get modules and submodules
 */
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

/**
 * SubModule entity
 */
export interface SubModule {
  smId: string
  smName: string
  smPath: string
  smIcon?: string | null
  smState?: boolean | null
  view?: boolean | null
}

/**
 * Module entity
 */
export interface Module {
  mId: string
  mName: string
  mPath: string
  mPriority?: number | null
  mIcon?: string | null
  view?: boolean | null
  subModules?: SubModule[]
}

/**
 * Permissions map
 */
export type Permissions = Record<string, boolean>

/**
 * User role structure
 */
export interface Role {
  permissions?: Permissions
}

/**
 * User data structure
 */
export interface UserData {
  role?: Role
}

/**
 * Hook params
 */
export interface UseModulesParams {
  dataUser?: UserData
  callback?: (modules: Module[]) => void
}

/**
 * Hook return type
 */
export interface UseModulesResult {
  loading: boolean
  error?: Error
  modules: Module[]
}

/**
 * Custom hook to fetch and validate modules based on user permissions
 *
 * @param {UseModulesParams} params - Hook parameters
 * @returns {UseModulesResult}
 */
export const useModules = ({
  dataUser = {},
  callback = () => {}
}: UseModulesParams = {}): UseModulesResult => {
  const permissions: Permissions = dataUser?.role?.permissions ?? {}

  const { loading, error, data } = useQuery<{ modules: Module[] }>(GET_MODULES, {
    fetchPolicy: 'cache-and-network',
    onCompleted: (response) => {
      if (Array.isArray(response?.modules)) {
        callback(response.modules)
      }
    },
    onError: (err) => {
      console.error('Error fetching modules:', err)
    }
  })

  const safeModules: Module[] = Array.isArray(data?.modules) ? data.modules : []

  // cast to any to work around a too-narrow parameter type in the helper
  const filteredModules: Module[] = validateModules(safeModules as any, permissions)

  return {
    loading,
    error: error ?? undefined,
    modules: filteredModules
  }
}
