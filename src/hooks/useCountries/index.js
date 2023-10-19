import { useQuery } from '@apollo/client'
import { GET_ALL_COUNTRIES } from './queries'
/**

 * Hook personalizado para obtener todos los países.
 *
 * @returns {Object} - Retorna un objeto con la data de los países y cualquier otro estado/error relacionado con la consulta.
 */
export function useCountries () {
  const { data, loading, error } = useQuery(GET_ALL_COUNTRIES)

  // Aquí puedes manejar la lógica adicional que necesites, como mapear la data, manejar errores, etc.

  return {
    data: data ? data.countries : [],
    loading,
    error
  }
}
