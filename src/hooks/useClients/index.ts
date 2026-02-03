import {
  useQuery,
  useMutation,
  useLazyQuery,
  ApolloError,
  ApolloQueryResult,
  MutationFunction,
  LazyQueryExecFunction
} from '@apollo/client'

import {
  CREATE_CLIENTS,
  DELETE_ONE_CLIENTS,
  GET_ALL_CLIENTS,
  GET_ONE_CLIENT,
  EDIT_ONE_CLIENT
} from './queries'

import type { SendNotificationFn } from 'typesdefs'


/* ---------- GraphQL-related Types ---------- */

/** Generic GraphQL error context */
type GQLErrorContext = {
  limit?: number
  value?: unknown
  label?: string
  key?: string
  __typename?: string
}

/** Generic GraphQL field error */
export type GQLError = {
  path?: string
  message?: string
  type?: string
  context?: GQLErrorContext
}

/** Client shape (shared fields from your queries) */
export type Client = {
  cliId?: string
  idStore?: string
  idUser?: string
  clState?: number
  clientNumber?: string
  ClientAddress?: string | null
  gender?: string | null
  ccClient?: string | null
  clientLastName?: string | null
  clientName?: string | null
  default?: boolean
  createAt?: string | Date
  updateAt?: string | Date
}

/** Pagination metadata */
type Pagination = {
  totalRecords?: number
  totalPages?: number
  currentPage?: number
}

/** Response wrappers */
type GetAllClientsPayload = {
  success?: boolean
  message?: string
  data?: Client[]
  pagination?: Pagination
  errors?: GQLError[]
}

type GetAllClientsResponse = {
  getAllClients?: GetAllClientsPayload
}

type GetAllClientsVars = {
  idStore?: string
  search?: string
  min?: number
  max?: number
  fromDate?: string
  toDate?: string
  page?: number
  order?: 'ASC' | 'DESC' | string
}

type GetOneClientResponse = {
  getOneClients?: Client
}

type GetOneClientVars = { cliId?: string }

type CreateClientsResponse = {
  createClients?: {
    success?: boolean
    message?: string
    errors?: GQLError[]
    data?: Client
  }
}

type CreateClientsVars = { input: Record<string, any> } // replace with strong type if available

type EditOneClientResponse = {
  editOneClient?: {
    success?: boolean
    message?: string
    errors?: GQLError[]
  }
}

type EditOneClientVars = { input: Record<string, any> } // replace with strong type if available

type DeleteClientResponse = {
  deleteClient?: {
    success?: boolean
    message?: string
  }
}

type DeleteClientVars = { cliId?: string; clState: number }

/** Hook option shapes */
type BaseHookOptions = {
  sendNotification?: SendNotificationFn
}

type UseGetClientsOptions = BaseHookOptions & {
  max?: number
  order?: 'ASC' | 'DESC' | string
  search?: string
}

/* ---------- Hooks (typed) ---------- */

/**
 * useGetClients
 * @param root0
 * @param root0.max
 * @param root0.order
 * @param root0.search
 * @param root0.sendNotification
 * @returns [clients, { loading, buttonLoading, error, refetch }]
 */
export const useGetClients = ({
  max,
  order = 'DESC',
  search,
  sendNotification = () => {}
}: UseGetClientsOptions = {}): [
  Client[],
  {
    loading: boolean
    buttonLoading: boolean
    error?: ApolloError | null
    refetch: (vars?: Partial<GetAllClientsVars>) => Promise<ApolloQueryResult<GetAllClientsResponse>>
  }
] => {
  const {
    loading,
    error,
    called,
    data,
    refetch
  } = useQuery<GetAllClientsResponse, GetAllClientsVars>(GET_ALL_CLIENTS, {
    onError: () => {
      sendNotification({
        title: 'Error',
        description: 'Algo salió mal',
        backgroundColor: 'error'
      })
    },
    variables: {
      search,
      max: max ?? 100,
      order
    }
  })

  const clients = data?.getAllClients?.data ?? []

  return [
    clients,
    {
      loading: called ? false : loading,
      buttonLoading: loading,
      error,
      refetch
    }
  ]
}

/**
 * useDeleteClients
 * @param root0
 * @param root0.sendNotification
 * @returns [deleteFn, { loading, error }]
 */
export const useDeleteClients = ({
  sendNotification = () => {}
}: BaseHookOptions = {}): [
  MutationFunction<DeleteClientResponse, DeleteClientVars>,
  { loading: boolean; error?: ApolloError | null }
] => {
  const [deleteClient, { loading, error }] = useMutation<DeleteClientResponse, DeleteClientVars>(
    DELETE_ONE_CLIENTS,
    {
      onError: (err) => {
        sendNotification({
          title: 'Error',
          description: err.message ?? 'Error deleting client',
          backgroundColor: 'error'
        })
      }
    }
  )

  return [deleteClient, { loading, error }]
}

/**
 * useCreateClient
 * @param root0
 * @param root0.sendNotification
 * @returns [createFn, { loading, error }]
 */
export const useCreateClient = ({
  sendNotification = () => {}
}: BaseHookOptions = {}): [
  MutationFunction<CreateClientsResponse, CreateClientsVars>,
  { loading: boolean; error?: ApolloError | null }
] => {
  const [createClients, { loading, error }] = useMutation<CreateClientsResponse, CreateClientsVars>(
    CREATE_CLIENTS,
    {
      onError: () => {
        sendNotification({
          title: '',
          description: 'Error',
          backgroundColor: 'error'
        })
      }
    }
  )

  // createClients is a function (never null), keep types strict
  return [createClients, { loading, error }]
}

/**
 * useEditClient
 * @param root0
 * @param root0.sendNotification
 * @returns [editFn, { loading, error, data }]
 */
export const useEditClient = ({
  sendNotification = () => {}
}: BaseHookOptions = {}): [
  MutationFunction<EditOneClientResponse, EditOneClientVars>,
  { loading: boolean; error?: ApolloError | null; data?: EditOneClientResponse | null }
] => {
  const [editOneClient, { loading, error, data }] = useMutation<
    EditOneClientResponse,
    EditOneClientVars
  >(EDIT_ONE_CLIENT, {
    onCompleted: (resp) => {
      if (resp?.editOneClient?.success) {
        return sendNotification({
          title: 'Éxito',
          description: resp.editOneClient.message ?? '',
          backgroundColor: 'success'
        })
      }
      return undefined;
    },
    onError: (err) => {
      // err.graphQLErrors may contain structured info; fallback to generic message
      sendNotification({
        title: 'Error',
        description: err.message ?? 'Error editing client',
        backgroundColor: 'error'
      })
    }
  })

  return [editOneClient, { loading, error, data }]
}

/**
 * useGetOneClient
 * @param root0
 * @param root0.sendNotification
 * @returns [getOneFn, { loading, error, data }]
 */
export const useGetOneClient = ({
  sendNotification = () => {}
}: BaseHookOptions = {}): [
  LazyQueryExecFunction<GetOneClientResponse, GetOneClientVars>,
  { loading: boolean; error?: ApolloError | null; data?: GetOneClientResponse | null }
] => {
  const [getOneClients, { data, loading, error }] = useLazyQuery<
    GetOneClientResponse,
    GetOneClientVars
  >(GET_ONE_CLIENT, {
    onError: (err) => {
      sendNotification({
        title: 'Error',
        description: err.message ?? 'Error fetching client',
        backgroundColor: 'error'
      })
    }
  })

  // still returning the raw lazy exec function and current state
  return [getOneClients, { loading, error, data }]
}
