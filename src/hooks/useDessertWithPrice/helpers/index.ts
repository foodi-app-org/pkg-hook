type ExtraItem = {
  extraName?: string
  extraPrice?: number | string
  exState?: boolean
  forEdit?: boolean
  manageStock?: boolean
  stock?: number
  [key: string]: any
}

type LineItem = {
  error?: boolean
  messageError?: string
  [key: string]: any
}

type LineItemsState = {
  Lines: LineItem[]
  [key: string]: any
}

type CheckNumberRangeItem = {
  index: number
  item: ExtraItem
}

export const transformData = (dataExtra: ExtraItem[]): ExtraItem[] => {
  const transformedData = dataExtra?.map((item: ExtraItem) => {
    return {
      extraName: item.extraName || '',
      extraPrice: item?.extraPrice?.toString() || '',
      exState: Boolean(item.exState),
      manageStock: Boolean(item.manageStock),
      stock: Number(item.stock) || 1,
      forEdit: true,
      ...item
    }
  })

  return transformedData
}

export const MAX_INTEGER = 999999999999.99

export const isWithinRange = (num: number): boolean => {
  // Verificar si el número está dentro del rango permitido.
  return num >= MAX_INTEGER
}

export const findNumbersExceedingRange = (arr: ExtraItem[]): { index: number; item: ExtraItem }[] => {
  return arr.reduce((acc: { index: number; item: ExtraItem }[], item: ExtraItem, index: number) => {
    const extraPrice = typeof item.extraPrice === 'number'
      ? item.extraPrice
      : Number.parseFloat(
          (item.extraPrice as string).replaceAll('.', '')
        )
    if (isWithinRange(extraPrice)) {
      acc.push({ index, item })
    }
    return acc
  }, [])
}

type UpdateErrorFieldByIndexParams = {
  setLine: (array: any) => any
  checkNumberRange: CheckNumberRangeItem[]
}

/**
 * Determina si una línea tiene campos requeridos vacíos (nombre o precio).
 *
 * @param item - Línea de complemento a validar.
 * @returns `true` cuando falta el nombre o el precio.
 */
export const hasEmptyRequiredFields = (item: ExtraItem): boolean => {
  const nameEmpty =
    item?.extraName === undefined ||
    item?.extraName === null ||
    String(item.extraName).trim() === ''

  const priceRaw = item?.extraPrice
  const priceEmpty =
    priceRaw === undefined ||
    priceRaw === null ||
    String(priceRaw).trim() === '' ||
    Number.isNaN(Number(priceRaw))

  return nameEmpty || priceEmpty
}

/**
 * Marca cada línea con los campos vacíos como requerida (`error`) y guarda el
 * detalle por campo (`errorName` / `errorPrice`) para que la UI resalte el
 * input correcto. Las líneas válidas se limpian de errores previos.
 *
 * @param setLine - Setter del estado de LineItems.
 * @returns Los índices de las líneas con campos vacíos.
 */
export const markEmptyRequiredFields = (
  setLine: (array: any) => any
): number[] => {
  const invalidIndexes: number[] = []

  setLine((prevLineItems: LineItemsState) => {
    const updatedLines = prevLineItems.Lines.map(
      (line: LineItem, index: number) => {
        const nameEmpty =
          line?.extraName === undefined ||
          line?.extraName === null ||
          String(line.extraName).trim() === ''

        const priceRaw = line?.extraPrice
        const priceEmpty =
          priceRaw === undefined ||
          priceRaw === null ||
          String(priceRaw).trim() === '' ||
          Number.isNaN(Number(priceRaw))

        if (nameEmpty || priceEmpty) {
          invalidIndexes.push(index)

          return {
            ...line,
            error: true,
            errorName: nameEmpty,
            errorPrice: priceEmpty,
            messageError: 'Este campo es obligatorio'
          }
        }

        return {
          ...line,
          error: false,
          errorName: false,
          errorPrice: false,
          messageError: ''
        }
      }
    )

    return { ...prevLineItems, Lines: updatedLines }
  })

  return invalidIndexes
}

export const updateErrorFieldByIndex = ({
  setLine,
  checkNumberRange
}: UpdateErrorFieldByIndexParams): void => {
  setLine((prevLineItems: LineItemsState) => {
    // Crea una copia del estado anterior de LineItems
    const updatedLineItems = { ...prevLineItems }

    // Utiliza map para iterar sobre cada elemento en checkNumberRange
    const updatedLines = updatedLineItems.Lines.map((line: LineItem, index: number) => {
      // Verifica si el índice está dentro del rango de LineItems.Lines
      if (checkNumberRange.some((item: CheckNumberRangeItem) => item.index === index)) {
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
