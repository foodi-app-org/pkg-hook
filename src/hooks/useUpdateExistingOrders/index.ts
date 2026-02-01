export const isValidCodeRef = (codeRef: string) => {
  return typeof codeRef === 'string' && codeRef.trim() !== ''
}

type StatusKey = 1 | 2 | 3 | 4 | 5;
type StatusString = 'ACCEPT' | 'PROCESSING' | 'READY' | 'CONCLUDES' | 'REJECTED';
type Order = { pCodeRef: string; pSState: StatusKey; [key: string]: unknown };
type ExistingOrders = { [key in StatusString]: Order[] };

export const updateExistingOrders = (
  existingOrders: ExistingOrders,
  pCodeRef: string,
  pSState: StatusKey,
  objectToAdd?: Order
): ExistingOrders => {
  if (typeof existingOrders !== 'object' || existingOrders === null) {
    // existingOrders no es un objeto válido
    return existingOrders
  }
  if (typeof pCodeRef !== 'string') {
    // Los tipos de datos de pCodeRef
    return existingOrders
  }
  if (!isValidCodeRef(pCodeRef)) {
    // Valores de entrada no válidos, devuelve existingOrders sin cambios
    return existingOrders
  }

  const updatedExistingOrders = { ...existingOrders } // Copiar el objeto existente

  const statusKeys: Record<StatusKey, StatusString> = {
    1: 'ACCEPT',
    2: 'PROCESSING',
    3: 'READY',
    4: 'CONCLUDES',
    5: 'REJECTED'
  }
  const targetArray = statusKeys[pSState]

  if (!targetArray || !(targetArray in existingOrders)) {
    // El valor de pSState no está mapeado a ninguna propiedad existente en existingOrders
    return existingOrders
  }
  (Object.keys(updatedExistingOrders) as StatusString[]).forEach((key) => {
    if (Array.isArray(updatedExistingOrders[key])) {
      const oneSale = (updatedExistingOrders[key]).find((order) => {
        return order.pCodeRef === pCodeRef
      })

      updatedExistingOrders[key] = (updatedExistingOrders[key]).filter(
        (order) => {
          return order.pCodeRef !== pCodeRef
        }
      )

      if (oneSale !== undefined && oneSale !== null) {
        const updatedOneSale = { ...oneSale, pSState }

        if (!Array.isArray(updatedExistingOrders[targetArray])) {
          updatedExistingOrders[targetArray] = []
        }

        updatedExistingOrders[targetArray] = [
          updatedOneSale,
          ...updatedExistingOrders[targetArray]
        ]
      }
    }
  })

  if (objectToAdd?.pCodeRef === pCodeRef) {
    if (!Array.isArray(updatedExistingOrders[targetArray])) {
      updatedExistingOrders[targetArray] = []
    }

    updatedExistingOrders[targetArray] = [
      objectToAdd,
      ...updatedExistingOrders[targetArray]
    ]
  }

  // Asegurar que todas las propiedades estén presentes
  (Object.keys(statusKeys)
    .map(Number)
    .filter((k): k is StatusKey => [1, 2, 3, 4, 5].includes(k as StatusKey)))
    .forEach((statusKey) => {
      const key = statusKeys[statusKey];
      if (!(key in updatedExistingOrders)) {
        updatedExistingOrders[key] = []
      }
    })

  return updatedExistingOrders
}
