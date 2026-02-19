import { useCallback, useState } from 'react'

/**
 * Tipos para las funciones que obtienen departamentos/ciudades.
 * Se admite que puedan devolver una Promise (fetch async) o void.
 */
type FetchFn<TVars extends Record<string, any>> = (
  args: { variables: TVars }
) => void | Promise<unknown>

export type ValuesType = Record<string, any>
export type ErrorsType = Record<string, any>

export interface UseLocationManagerOptions<V extends ValuesType = ValuesType> {
  initialValues?: V
  initialShowLocation?: boolean
}

export interface UseLocationManagerReturn<V extends ValuesType = ValuesType> {
  values: V
  errors: ErrorsType
  showLocation: boolean
  setShowLocation: React.Dispatch<React.SetStateAction<boolean>>
  handleChangeSearch: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    error?: any
  ) => void
  setValues: React.Dispatch<React.SetStateAction<V>>
  setErrors: React.Dispatch<React.SetStateAction<ErrorsType>>
  reset: (nextValues?: Partial<V>) => void
}

/**
 * useLocationManager
 * Hook optimizado para manejar valores/errores de ubicación y disparar
 * peticiones para departamentos/ciudades cuando corresponde.
 *
 * - Usa useCallback para memorizar handlers.
 * - Acepta funciones async o sync para fetchDepartments/fetchCities.
 * - Expone setValues/setErrors y reset para casos especiales.
 * @param fetchDepartments
 * @param fetchCities
 * @param options
 * @returns {UseLocationManagerReturn}
 * 
 */
export function useLocationManager<V extends ValuesType = ValuesType>(
  fetchDepartments: FetchFn<{ cId: string }>,
  fetchCities: FetchFn<{ dId: string }>,
  options: UseLocationManagerOptions<V> = {}
): UseLocationManagerReturn<V> {
  const { initialValues = {} as V, initialShowLocation = true } = options

  const [values, setValues] = useState<V>(initialValues)
  const [errors, setErrors] = useState<ErrorsType>({})
  const [showLocation, setShowLocation] = useState<boolean>(initialShowLocation)

  // Actualiza un campo en values (inmutable)
  const setField = useCallback(
    (name: string, value: any) =>
      setValues(prev => ({ ...prev, [name]: value }) as V),
    []
  )

  // Actualiza un campo en errors
  const setError = useCallback((name: string, error: any) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const handleCountrySearch = useCallback(
    (cId: string) => {
      // no await here: permitimos que fetch sea async o sync
      void fetchDepartments({ variables: { cId } })
    },
    [fetchDepartments]
  )

  const handleDepartmentSearch = useCallback(
    (dId: string) => {
      // limpia el campo de ciudad sólo si existía o era distinto
      setValues(prev => ({ ...prev, ctId: '' } as V))
      void fetchCities({ variables: { dId } })
    },
    [fetchCities]
  )

  const handleChangeSearch = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      error: any = undefined
    ) => {
      const { name, value } = e.target

      // ordenado explícito para mantener las reglas de negocio claras
      if (name === 'countryId') {
        handleCountrySearch(value)
      } else if (name === 'code_dId') {
        handleDepartmentSearch(value)
      }

      setField(name, value)
      setError(name, error)
    },
    [handleCountrySearch, handleDepartmentSearch, setField, setError]
  )

  const reset = useCallback((nextValues?: Partial<V>) => {
    setValues(() => ({ ...((nextValues as V) ?? {}) } as V))
    setErrors({})
  }, [])

  return {
    values,
    errors,
    showLocation,
    setShowLocation,
    handleChangeSearch,
    setValues,
    setErrors,
    reset
  }
}
