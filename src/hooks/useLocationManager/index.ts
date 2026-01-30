import { useState } from 'react'

/**
 * Hook para gestionar la lógica de ubicaciones, valores y errores.
 *
 * @param {Function} getDepartments - Función para obtener los departamentos basado en el ID de país.
 * @param {Function} getCities - Función para obtener las ciudades basado en el ID de departamento.
 *
 * @returns {Object} - Retorna los estados y funciones de manejo asociados.
 */
export function useLocationManager (getDepartments, getCities) {
  const [values, setValues] = useState({})
  console.log('🚀 ~ useLocationManager ~ values:', values)
  const [errors, setErrors] = useState({})
  const [showLocation, setShowLocation] = useState(true)

  const handleUpdateValues = (name, value) => {
    setValues(prevValues => {return { ...prevValues, [name]: value }})
  }

  const handleUpdateErrors = (name, error) => {
    setErrors(prevErrors => {return { ...prevErrors, [name]: error }})
  }

  const handleCountrySearch = (value) => {
    getDepartments({ variables: { cId: value } })
  }

  const handleDepartmentSearch = (value) => {
    setValues(prevValues => {return { ...prevValues, ctId: '' }})
    getCities({ variables: { dId: value } })
  }

  const handleChangeLocation = (e, error) => {
    const { name, value } = e.target
    handleUpdateValues(name, value)
    handleUpdateErrors(name, error)
  }

  const handleChangeSearch = (e) => {
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
    handleChangeLocation(e)
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
