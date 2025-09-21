import { randomBytes } from 'crypto'

/**
 * @description It takes an array of elements and returns an object with a submit hook for each element.
 * @version 0.1.1
 * @param {array} elements elementos del formulario
 * @return {array} devuelve un array de booleanos con el nombre identificador para cada estado en react.
 */
const validTypes = {
  text: true,
  password: true,
  email: true,
  number: true,
  hidden: true,
  textarea: true
}

export const statusOrder = {
  0: '',
  1: 'ENTRANTE',
  2: 'PROCESO',
  3: 'LISTOS',
  4: 'CONCLUIDOS',
  5: 'REJECTED'
}

export const statusProduct = {
  deleted: 0,
  active: 1
}

export const validationSubmitHooks = elements => {
  if (!elements || elements.length === 0) {
    return {}
  }
  let errorForm = {}

  for (const element of elements) {
    if (element.name) {
      const elementType = element.type || element.tagName.toLowerCase()
      if (validTypes[elementType]) {
        if (element.dataset.required === 'true') {
          if (!element.value) {
            errorForm = { ...errorForm, [element.name]: true }
          } else {
            errorForm = { ...errorForm, [element.name]: false }
          }
        } else {
          errorForm = { ...errorForm, [element.name]: false }
        }
      }
    }
  }

  return errorForm
}

export const getCurrentDomain = () => {
  return typeof window !== 'undefined' && window.location.hostname
}

/**
 * Generates a cryptographically secure random string of given length.
 * @param length - Desired length of the generated code.
 * @param options - Optional prefix/suffix configuration.
 * @returns Random alphanumeric string with optional prefix and suffix.
 */
export const RandomCode = (
  length,
  options
) => {
  if (length <= 0) {
    throw new Error('Length must be greater than 0')
  }

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length

  // Generate enough random bytes
  const randomBuffer = randomBytes(length)
  let code = ''

  for (let i = 0; i < length; i++) {
    const index = randomBuffer[i] % charactersLength
    code += characters.charAt(index)
  }

  return `${options?.prefix ?? ''}${code}${options?.suffix ?? ''}`
}

/**
 * actualizar cache de apollo
 * @param {{ cache: object, query: object, nameFun: string, dataNew: object, type: number, id: string }} params Parámetros para actualizar el cachet de apollo
 * @returns {null} no hay retorno
 */
export const updateCacheMod = async ({ cache, query, nameFun, dataNew, type, id }) => {
  return cache.modify({
    fields: {
      [nameFun] (dataOld = []) {
        if (type === 1) return cache.writeQuery({ query, data: [...(dataOld || []), { ...(dataNew || {}) }] })
        if (type === 2) return cache.writeQuery({ query, data: { ...(dataOld || {}), ...(dataNew || {}) } })
        if (type === 3) return cache.writeQuery({ query, data: dataOld.filter(x => { return x === id }) })
      }
    }
  })
}
/**
 * Formatea un valor como un número siguiendo el formato de Colombia.
 * Si el valor no es un número válido, lo devuelve tal como está.
 *
 * @param {string|number} value - El valor a formatear.
 * @returns {string} El valor formateado como número o el valor original si no es numérico.
 */
export const numberFormat = value => {
  // Verifica si el valor es nulo o indefinido, devolviendo el mismo valor.
  if (value === null || value === undefined) {
    return value
  }

  // Convierte el valor a string y elimina puntos.
  const stringValue = `${value}`.replace(/\./g, '')

  // Intenta convertir a número y formatear si es posible.
  const numberValue = parseFloat(stringValue)
  if (!isNaN(numberValue)) {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      style: 'decimal',
      maximumFractionDigits: 2
    }).format(numberValue)
  }

  // Devuelve el valor original si no es un número.
  return value
}
/**
 *
 * @param {Object} data objeto a filtrar
 * @param {Array} filters array a comparar o claves del objeto a excluir
 * @param {boolean} dataFilter booleano para devolver los datos filtrados o no
 * @return {Object} devuelve un objeto con los datos filtrados
 */
export const filterKeyObject = (data, filters, dataFilter) => {
  let values = {}; let valuesFilter = {}
  for (const elem in data) {
    let coincidence = false
    for (let i = 0; i < filters.length; i++) {
      if (elem === filters[i]) coincidence = true
      else valuesFilter = filters[i]
    }

    if (!coincidence) values = { ...values, [elem]: data[elem] }
    else valuesFilter = { ...valuesFilter, [elem]: data[elem] }
  }
  if (!dataFilter) return values
  if (dataFilter) return { values, valuesFilter }
}
export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]
export const SPANISH_MONTHS = {
  0: 'Enero',
  1: 'Febrero',
  2: 'Marzo',
  3: 'Abril',
  4: 'Mayo',
  5: 'Junio',
  6: 'Julio',
  7: 'Augosto',
  8: 'Septiembre',
  9: 'Octubre',
  10: 'Noviembre ',
  11: 'Diciembre'
}

export const days = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo'
}

export const convertBase64 = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (file) {
      reader.readAsDataURL(file)
    }
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = error => {
      reject(error)
    }
  })
}

export const validationImg = file => { return (/\.(jpg|png|gif|jpeg)$/i).test(file.name) }

export const SERVICES = Object.freeze({
  WEB_SOCKET_CHAT: 'web-socket-chat',
  ADMIN_SERVER: 'admin-server',
  ADMIN_STORE: 'admin-store',
  MAIN: 'main'
})

export const paymentMethodCards = [
  {
    name: 'Visa',
    icon: 'IconVisa'
  },
  {
    name: 'MasterCard',
    icon: 'IconMasterCard'
  }
]

export const CATEGORY_EMPTY = 'NINGUNO'

export * from './UtilDateRange'

const cleanValue = ({ value, decimalSeparator, groupSeparator, allowDecimals, decimalsLimit, allowNegativeValue, disableAbbreviations }) => {
  if (typeof value !== 'string') return null

  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[$€£¥]/g, '').trim()

  // Handle abbreviations like K, M, B
  if (!disableAbbreviations) {
    cleaned = cleaned.replace(/([kmb])\b/i, (match) => {
      const multipliers = { k: 1e3, m: 1e6, b: 1e9 }
      return multipliers[match.toLowerCase()] ? `*${multipliers[match.toLowerCase()]}` : ''
    })
  }

  // Replace group separator with empty string
  if (groupSeparator) {
    cleaned = cleaned.replace(new RegExp(`\\${groupSeparator}`, 'g'), '')
  }

  // Replace decimal separator with a dot
  if (decimalSeparator) {
    cleaned = cleaned.replace(new RegExp(`\\${decimalSeparator}`, 'g'), '.')
  }

  // Remove any non-numeric characters except for the decimal point
  cleaned = cleaned.replace(/[^0-9.-]/g, '')

  // Limit decimals if specified
  if (allowDecimals && decimalsLimit > 0) {
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, decimalsLimit)
      cleaned = parts.join('.')
    }
  }

  // Handle negative values
  if (!allowNegativeValue) {
    cleaned = cleaned.replace(/-/g, '')
  }

  return cleaned
}
/**
 * Converts a formatted string with group and decimal separators into a float number.
 *
 * @param value - The formatted string input, e.g., "$ 1.234,56"
 * @param decimalSeparator - The character used as decimal separator, e.g., ','
 * @param groupSeparator - The character used as group/thousands separator, e.g., '.'
 * @returns The parsed float value or null if input is invalid
 */
export function parseFormattedFloat (value) {
  if (!value) return 0
  const options = {
    decimalSeparator: ',',
    groupSeparator: '.',
    allowDecimals: true,
    decimalsLimit: 20,
    allowNegativeValue: true,
    disableAbbreviations: false
  }
  const cleaned = cleanValue({ value, ...options })

  const normalized = (typeof options.decimalSeparator === 'string' && options.decimalSeparator !== '')
  // Replace the decimal separator with a dot for parsing
    ? cleaned.replace(options.decimalSeparator, '.')
    : cleaned

  const num = parseFloat(normalized)
  return isNaN(num) ? 0 : num
}
