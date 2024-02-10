import { useMutation } from '@apollo/client'
import { UPDATE_MULTI_EXTRAS_PRODUCT_FOOD } from './queries'

/**
 * Custom hook para manejar la actualización de múltiples extras de productos alimenticios.
 * @param {Function} cleanLines - Función para limpiar líneas después de completar la mutación.
 * @param {Function} handleCleanLines - Función.
 * @returns {Array} Retorna un array con la función de mutación y el estado de carga.
 */
export const useUpdateMultipleExtProductFoods = ({ cleanLines = () => { }, handleCleanLines = () => { } } = {
  cleanLines: () => { },
  handleCleanLines: () => { }
}) => {
  const [updateMultipleExtProductFoods, { loading }] = useMutation(UPDATE_MULTI_EXTRAS_PRODUCT_FOOD, {
    onCompleted: () => {
      cleanLines()
    }
  })

  return [updateMultipleExtProductFoods, { loading }]
}
