export const isValidCodeRef = (codeRef) => {
  return typeof codeRef === "string" && codeRef.trim() !== "";
};

export const isValidState = (state) => {
  const validStates = [0, 1, 2, 3, 4, 5];
  return validStates.includes(state);
};

export const updateExistingOrders = (
  existingOrders,
  pCodeRef,
  pSState,
  objectToAdd
) => {
  if (typeof existingOrders !== "object" || existingOrders === null) {
    // existingOrders no es un objeto válido
    return existingOrders;
  }
  if (typeof pCodeRef !== "string" || typeof pSState !== "number") {
    // Los tipos de datos de pCodeRef y pSState no son los esperados
    return existingOrders;
  }
  if (!isValidCodeRef(pCodeRef) || !isValidState(pSState)) {
    // Valores de entrada no válidos, devuelve existingOrders sin cambios
    return existingOrders;
  }

  const updatedExistingOrders = { ...existingOrders }; // Copiar el objeto existente

  const statusKeys = {
    1: "ACEPTA",
    2: "PROCESSING",
    3: "READY",
    4: "CONCLUDES",
    5: "RECHAZADOS",
  };
  const targetArray = statusKeys[pSState];

  if (!targetArray || !(targetArray in existingOrders)) {
    // El valor de pSState no está mapeado a ninguna propiedad existente en existingOrders
    return existingOrders;
  }

  Object.keys(updatedExistingOrders).forEach((key) => {
    if (Array.isArray(updatedExistingOrders[key])) {
      const oneSale = updatedExistingOrders[key].find((order) => {
        return order.pCodeRef === pCodeRef;
      });

      updatedExistingOrders[key] = updatedExistingOrders[key].filter(
        (order) => {
          return order.pCodeRef !== pCodeRef;
        }
      );

      if (oneSale !== undefined && oneSale !== null) {
        const updatedOneSale = { ...oneSale, pSState };

        if (!Array.isArray(updatedExistingOrders[targetArray])) {
          updatedExistingOrders[targetArray] = [];
        }

        updatedExistingOrders[targetArray] = [
          updatedOneSale,
          ...updatedExistingOrders[targetArray],
        ];
      }
    }
  });

  if (objectToAdd && objectToAdd.pCodeRef === pCodeRef) {
    if (!Array.isArray(updatedExistingOrders[targetArray])) {
      updatedExistingOrders[targetArray] = [];
    }

    updatedExistingOrders[targetArray] = [
      objectToAdd,
      ...updatedExistingOrders[targetArray],
    ];
  }

  // Asegurar que todas las propiedades estén presentes
  Object.keys(statusKeys).forEach((statusKey) => {
    if (!(statusKeys[statusKey] in updatedExistingOrders)) {
      updatedExistingOrders[statusKeys[statusKey]] = [];
    }
  });

  return updatedExistingOrders;
};
