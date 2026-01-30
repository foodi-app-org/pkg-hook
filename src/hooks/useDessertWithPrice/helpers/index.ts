export const transformData = (dataExtra) => {
  const transformedData = dataExtra?.map(item => {return {
    extraName: item.extraName || '',
    extraPrice: item?.extraPrice?.toString() || '',
    exState: Boolean(item.exState),
    forEdit: true,
    ...item
  }})

  return transformedData
}

export const MAX_INTEGER = 999999999999.99
/**
 * Validate if a number is within a specified range.
 * @param {number} num - The number to validate.
 * @returns {boolean} - True if the number is within the range, false otherwise.
 */
export const isWithinRange = (num) => {
  // Verificar si el número está dentro del rango permitido.
  return num >= MAX_INTEGER
}

/**
 * Find objects in the array where the value of 'extraPrice' exceeds the specified range.
 * @param {array} arr - The array to search.
 * @returns {array} - An array containing the indices and objects of the items exceeding the range.
 */
export const findNumbersExceedingRange = (arr) => {
  return arr.reduce((acc, item, index) => {
    const extraPrice = typeof item.extraPrice === 'number' ? item.extraPrice : parseFloat(item.extraPrice.replace(/\./g, ''))
    if (isWithinRange(extraPrice)) {
      acc.push({ index, item })
    }
    return acc
  }, [])
}

export const updateErrorFieldByIndex = ({
  setLine = (array) => {
    return array
  },
  checkNumberRange = []
} = {
  setLine: (array) => {
    return array
  },
  checkNumberRange: []
}) => {
  setLine(prevLineItems => {
    // Crea una copia del estado anterior de LineItems
    const updatedLineItems = { ...prevLineItems }

    // Utiliza map para iterar sobre cada elemento en checkNumberRange
    const updatedLines = updatedLineItems.Lines.map((line, index) => {
      // Verifica si el índice está dentro del rango de LineItems.Lines
      if (checkNumberRange.some(item => {return item.index === index})) {
        // Crea una copia del elemento actual
        const updatedLine = { ...line }

        // Actualiza el campo 'error' del elemento a true
        updatedLine.error = true
        updatedLine.messageError = 'El precio no puede ser mayor a 999999999999.99'

        // Devuelve el elemento actualizado
        return updatedLine
      }

      // Si el índice no está en checkNumberRange, devuelve el elemento sin cambios
      return line
    })

    // Actualiza el array Lines en el estado de LineItems con los elementos actualizados
    return { ...updatedLineItems, Lines: updatedLines }
  })
}
