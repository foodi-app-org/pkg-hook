/**
 * Generic GraphQL error
 */
export interface GraphQLErrorItem {
  path: string
  message: string
  type: string
  context?: {
    limit?: number
    value?: string | number
    label?: string
    key?: string
  }
}

/**
 * Pagination info
 */
export interface Pagination {
  totalRecords: number
  totalPages: number
  currentPage: number
}

/**
 * Role entity
 */
export interface Role {
  idRole: string
  name: string
  priority: number
  description?: string
  permissions: string[] | Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/**
 * getRoles response
 */
export interface GetRolesResponse {
  getRoles: {
    success: boolean
    message: string
    data: Role[]
    pagination: Pagination
    errors?: GraphQLErrorItem[]
  }
}

/**
 * Query variables
 */
export interface GetRolesVars {
  idStore?: string
  search?: string
  min?: number
  max?: number
  fromDate?: string
  toDate?: string
  page?: number
  order?: 'ASC' | 'DESC'
}

/**
 * Hook params
 */
export interface UseGetRolesParams {
  max?: number
  order?: 'ASC' | 'DESC'
  search?: string
  sendNotification?: (params: {
    title: string
    description: string
    backgroundColor: 'error' | 'success' | 'warning'
  }) => void
}
