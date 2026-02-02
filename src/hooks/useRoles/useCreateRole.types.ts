import { ApolloError, MutationFunction } from '@apollo/client'

/**
 * Notification payload
 */
export interface NotificationPayload {
  title: string
  description: string
  backgroundColor: 'error' | 'success' | 'warning'
}

/**
 * Hook params
 */
export interface UseCreateRoleParams {
  sendNotification?: (payload: NotificationPayload) => void
}

/**
 * Role input (ajusta según tu schema real)
 */
export interface CreateRoleInput {
  name: string
  priority: number
  description?: string
  permissions: string[] | Record<string, unknown>
}

/**
 * Mutation variables
 */
export interface CreateRoleVars {
  input: CreateRoleInput
}

/**
 * Mutation response
 */
export interface CreateRoleResponse {
  createRoleMutation: {
    success: boolean
    message: string
  }
}

/**
 * Hook return
 */
export type UseCreateRoleReturn = [
  MutationFunction<CreateRoleResponse, CreateRoleVars>,
  {
    loading: boolean
    error?: ApolloError
    data: CreateRoleResponse['createRoleMutation'] | null
  }
]
