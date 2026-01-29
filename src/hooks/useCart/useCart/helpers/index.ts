import { filterKeyObject } from '../../../../utils'

const filters = ['__typename']

export const filterDataOptional = (dataOptional) => {
  if (!Array.isArray(dataOptional)) {
    throw new Error('Input data is not an array')
  }

  try {
    const filteredDataOptional = dataOptional.map(item => {
      const checkedSubOptions = item?.ExtProductFoodsSubOptionalAll?.filter(subItem => subItem.check === true)
      const ExtProductFoodsSubOptionalAll = checkedSubOptions?.map(subItemsOptional => {
        return {
          ...filterKeyObject(subItemsOptional, filters)
        }
      })
      return {
        ...filterKeyObject(item, filters),
        ExtProductFoodsSubOptionalAll
      }
    }).filter(item => item?.ExtProductFoodsSubOptionalAll.length > 0)
    return filteredDataOptional
  } catch (error) {
    console.error('An error occurred while filtering data:', error.message)
    return []
  }
}

/**
 * Valida los requerimientos de elementos opcionales.
 * @param {Array} filteredDataOptional - El array de datos a validar.
 * @returns {boolean} Devuelve true si se cumplen los requerimientos, de lo contrario, false.
 */
export function validateRequirements (filteredDataOptional) {
  if (Array.isArray(filteredDataOptional)) {
    for (const item of filteredDataOptional) {
      if (item.required === 1) {
        const checkedSubOptions = item?.ExtProductFoodsSubOptionalAll.filter(subItem => subItem.check === true)
        if (checkedSubOptions.length !== item.numbersOptionalOnly) {
          return true
        }
      }
    }
  }
  return false
}

export function validateExtraProducts (dataExtra) {
  const requiredItems = dataExtra.filter(item => item.exState === 1)

  if (requiredItems.length > 0) {
    const hasSelectedRequiredProduct = requiredItems.some(item => item.quantity > 0)
    return hasSelectedRequiredProduct
  }

  return true
}

export const filterExtra = (dataExtra) => {
  if (!Array.isArray(dataExtra)) {
    throw new Error('Input data is not an array')
  }
  try {
    const dataExtraFiltered = dataExtra.filter(extra => extra.quantity !== 0)
      .map(extra => {
        return {
          ...filterKeyObject(extra, filters)
        }
      })
    return dataExtraFiltered
  } catch (error) {
    return []
  }
}
