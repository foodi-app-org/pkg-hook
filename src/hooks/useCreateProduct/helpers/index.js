const MAX_PRICE = 2147483647

/**
 * Verifica si alguno de los valores en el array excede el precio máximo.
 *
 * @param {Array<number>} values - Lista de valores a verificar.
 * @param {Function} sendNotification - Función para enviar notificaciones.
 * @returns {boolean} - Retorna `true` si todos los valores están en rango, `false` si alguno excede el máximo.
 */
export const verifyPriceInRange = ({ values = [], sendNotification } = {
  values: [],
  sendNotification: () => {}
}) => {
  const isAnyValueOutOfRange = values.some(value => value > MAX_PRICE)

  if (isAnyValueOutOfRange) {
    sendNotification({
      backgroundColor: 'warning',
      title: 'Alerta',
      description: 'El valor es muy elevado'
    })
    return false
  }

  return true
}
