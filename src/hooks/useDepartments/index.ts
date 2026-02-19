import {
  useLazyQuery,
  LazyQueryExecFunction,
  ApolloError,
  QueryResult,
  OperationVariables
} from '@apollo/client'

import { GET_ALL_DEPARTMENTS } from './queries'

type Department = { id: string; name: string }

type GetAllDepartmentsData = { getAllDepartments: Department[] }
type GetAllDepartmentsVars = { cId: string }

/**
 * useDepartments
 * Hook para obtener departamentos basado en un ID de país.
 * Retorna una tupla con la función para ejecutar la consulta y un objeto con el estado de la consulta.
 * - Usa useLazyQuery para permitir ejecutar la consulta bajo demanda.
 * - El objeto de estado incluye data, loading, error, called, refetch y fetchMore.
 * - El tipo de retorno está forzado a ser una tupla con `as const` para mantener la inferencia de tipos.
 * @returns {readonly [LazyQueryExecFunction<GetAllDepartmentsData, GetAllDepartmentsVars>, { data: Department[]; loading: boolean; error?: ApolloError; called: boolean; refetch?: QueryResult<GetAllDepartmentsData, GetAllDepartmentsVars>['refetch']; fetchMore?: QueryResult<GetAllDepartmentsData, GetAllDepartmentsVars>['fetchMore'] }]}
 */
export function useDepartments(): readonly [
  LazyQueryExecFunction<GetAllDepartmentsData, GetAllDepartmentsVars>,
  {
    data: Department[]
    loading: boolean
    error?: ApolloError
    called: boolean
    refetch?: QueryResult<GetAllDepartmentsData, GetAllDepartmentsVars>['refetch']
    fetchMore?: QueryResult<GetAllDepartmentsData, GetAllDepartmentsVars>['fetchMore']
  }
] {
  const [getDepartments, query] = useLazyQuery<
    GetAllDepartmentsData,
    GetAllDepartmentsVars
  >(GET_ALL_DEPARTMENTS)

  const mapped = {
    data: query.data?.getAllDepartments ?? [],
    loading: query.loading,
    error: query.error,
    called: query.called,
    refetch: query.refetch,
    fetchMore: query.fetchMore
  }

  // 👇 CLAVE: forzamos el tipo de tupla con `as const`
  return [getDepartments, mapped] as const
}
