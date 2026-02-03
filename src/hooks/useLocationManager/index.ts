import { useState } from 'react'

type GetDepartmentsFn = (args: { variables: { cId: string } }) => void;
type GetCitiesFn = (args: { variables: { dId: string } }) => void;

type ValuesType = Record<string, any>;
type ErrorsType = Record<string, any>;

interface UseLocationManagerReturn {
  values: ValuesType;
  errors: ErrorsType;
  showLocation: boolean;
  setShowLocation: React.Dispatch<React.SetStateAction<boolean>>;
  handleChangeSearch: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, error?: any) => void;
  setValues: React.Dispatch<React.SetStateAction<ValuesType>>;
}

/**
 * Hook para gestionar la lógica de ubicaciones, valores y errores.
 *
 * @param getDepartments - Función para obtener los departamentos basado en el ID de país.
 * @param getCities - Función para obtener las ciudades basado en el ID de departamento.
 *
 * @returns Retorna los estados y funciones de manejo asociados.
 */
export function useLocationManager (
  getDepartments: GetDepartmentsFn,
  getCities: GetCitiesFn
): UseLocationManagerReturn {
  const [values, setValues] = useState<ValuesType>({})
  const [errors, setErrors] = useState<ErrorsType>({})
  const [showLocation, setShowLocation] = useState<boolean>(true)

  const handleUpdateValues = (name: string, value: any) => {
    setValues(prevValues => {return { ...prevValues, [name]: value }})
  }

  const handleUpdateErrors = (name: string, error: any) => {
    setErrors(prevErrors => {return { ...prevErrors, [name]: error }})
  }

  const handleCountrySearch = (value: string) => {
    getDepartments({ variables: { cId: value } })
  }

  const handleDepartmentSearch = (value: string) => {
    setValues(prevValues => {return { ...prevValues, ctId: '' }})
    getCities({ variables: { dId: value } })
  }

  const handleChangeLocation = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    error: any = undefined
  ) => {
    const { name, value } = e.target
    handleUpdateValues(name, value)
    handleUpdateErrors(name, error)
  }

  const handleChangeSearch = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    error: any = undefined
  ) => {
    const { name, value } = e.target
    switch (name) {
      case 'countryId':
        handleCountrySearch(value)
        break
      case 'code_dId':
        handleDepartmentSearch(value)
        break
      default:
        break
    }
    handleChangeLocation(e, error)
  }

  return {
    values,
    errors,
    showLocation,
    setShowLocation,
    handleChangeSearch,
    setValues
  }
}
