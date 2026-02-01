import { randomBytes } from 'node:crypto'

/**
 * @description It takes an array of elements and returns an object with a submit hook for each element.
 * @version 0.1.1
 * @param {array} elements elementos del formulario
 * @return {array} devuelve un array de booleanos con el nombre identificador para cada estado en react.
 */
const validTypes: Record<string, boolean> = {
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

export const validationSubmitHooks = (elements: Array<HTMLElement & { name?: string; type?: string; value?: unknown; dataset?: DOMStringMap }>) => {
  if (!elements || elements.length === 0) {
    return {}
  }
  let errorForm: Record<string, boolean> = {}

  for (const element of elements) {
    if (!element.name) continue;
    const elementType = (element.type as string) || element.tagName.toLowerCase();
    if (!validTypes[elementType]) continue;

    if (element.dataset && element.dataset.required === 'true') {
      errorForm = { ...errorForm, [element.name]: !element.value };
      continue;
    }

    errorForm = { ...errorForm, [element.name]: false };
  }

  return errorForm
}

export const getCurrentDomain = (): string | boolean => {
  return globalThis.window !== undefined && globalThis.window.location.hostname
}


interface RandomCodeOptions {
  prefix?: string;
  suffix?: string;
}

/**
 * Generates a cryptographically secure random string of given length.
 * @param length - Desired length of the generated code.
 * @param options - Optional prefix/suffix configuration.
 * @returns Random alphanumeric string with optional prefix and suffix.
 */
export const RandomCode = (
  length: number,
  options: RandomCodeOptions = {}
): string => {
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
import { ApolloCache, DocumentNode } from '@apollo/client';

export interface UpdateCacheModParams {
  cache: ApolloCache<unknown>;
  query: DocumentNode;
  nameFun: string;
  dataNew?: Record<string, unknown>;
  type: number;
  id?: string;
}

export const updateCacheMod = async ({
  cache,
  query,
  nameFun,
  dataNew,
  type,
  id
}: UpdateCacheModParams): Promise<ReturnType<ApolloCache<unknown>['modify']>> => {
  return cache.modify({
    fields: {
      [nameFun](dataOld: unknown) {
        if (type === 1 && Array.isArray(dataOld)) {
          return cache.writeQuery({
            query,
            data: [...dataOld, ...(dataNew ? [dataNew] : [])]
          });
        }
        if (type === 2 && typeof dataOld === 'object' && dataOld !== null && !Array.isArray(dataOld)) {
          return cache.writeQuery({
            query,
            data: { ...(dataOld as Record<string, unknown>), ...(dataNew) }
          });
        }
        if (type === 3 && Array.isArray(dataOld)) {
          return cache.writeQuery({
            query,
            data: dataOld.filter((x: unknown) => x === id)
          });
        }
        return undefined;
      }
    }
  });
}
/**
 * Formatea un valor como un número siguiendo el formato de Colombia.
 * Si el valor no es un número válido, lo devuelve tal como está.
 *
 * @param {string|number} value - El valor a formatear.
 * @returns {string} El valor formateado como número o el valor original si no es numérico.
 */
export const numberFormat = (value: string | number) => {
  // Verifica si el valor es nulo o indefinido, devolviendo el mismo valor.
  if (value === null || value === undefined) {
    return value
  }

  // Convierte el valor a string y elimina puntos.
  const stringValue = `${value}`.replaceAll('.', '')

  // Intenta convertir a número y formatear si es posible.
  const numberValue = Number.parseFloat(stringValue)
  if (!Number.isNaN(numberValue)) {
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
 * Filtra un objeto según las claves proporcionadas en filters.
 * @param data Objeto a filtrar.
 * @param filters Array de claves a comparar o excluir del objeto.
 * @param dataFilter Booleano para devolver los datos filtrados o no.
 * @returns El objeto filtrado según los parámetros.
 */
export const filterKeyObject = (
  data: Record<string, unknown>,
  filters: string[],
  dataFilter: boolean
): Record<string, unknown> | { values: Record<string, unknown>; valuesFilter: Record<string, unknown> } => {
  let values: Record<string, unknown> = {};
  let valuesFilter: Record<string, unknown> = {};
  for (const elem in data) {
    let coincidence = false;
    for (const filter of filters) {
      if (elem === filter) {
        coincidence = true;
        break;
      }
    }
    if (coincidence) {
      valuesFilter = { ...valuesFilter, [elem]: data[elem] };
    } else {
      values = { ...values, [elem]: data[elem] };
    }
  }
  if (dataFilter) return { values, valuesFilter };
  return values;
}

export const MONTHS: readonly string[] = [
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
] as const

export const SPANISH_MONTHS: Readonly<Record<number, string>> = {
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
} as const

export const days: Readonly<Record<number, string>> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo'
} as const

export const convertBase64 = (file: File): Promise<string | ArrayBuffer | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (file) {
      reader.readAsDataURL(file)
    }
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.onerror = error => {
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      reject(
        new Error(errorMessage)
      )
    }
  })
}

export const validationImg = (file: File): boolean => { return (/\.(jpg|png|gif|jpeg)$/i).test(file.name) }

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


interface CleanValueOptions {
  value: string;
  decimalSeparator?: string;
  groupSeparator?: string;
  allowDecimals?: boolean;
  decimalsLimit?: number;
  allowNegativeValue?: boolean;
  disableAbbreviations?: boolean;
}

const cleanValue = ({
  value,
  decimalSeparator,
  groupSeparator,
  allowDecimals,
  decimalsLimit,
  allowNegativeValue,
  disableAbbreviations
}: CleanValueOptions): string | null => {
  if (typeof value !== 'string') return null

  // Remove currency symbols and whitespace
  let cleaned = value.replaceAll(/[$€£¥]/g, '').trim()

  // Handle abbreviations like K, M, B
  if (!disableAbbreviations) {
    cleaned = cleaned.replaceAll(/([kmb])\b/i, (match) => {
      const multipliers: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 }
      const key = match.toLowerCase()
      return multipliers[key] ? `*${multipliers[key]}` : ''
    })
  }

  // replaceAll group separator with empty string
  if (groupSeparator) {
    cleaned = cleaned.replaceAll(new RegExp(`\\${groupSeparator}`, 'g'), '')
  }

  // replaceAll decimal separator with a dot
  if (decimalSeparator) {
    cleaned = cleaned.replaceAll(new RegExp(`\\${decimalSeparator}`, 'g'), '.')
  }

  // Remove any non-numeric characters except for the decimal point
  cleaned = cleaned.replaceAll(/[^0-9.-]/g, '')

  // Limit decimals if specified
  if (allowDecimals && typeof decimalsLimit === 'number' && decimalsLimit > 0) {
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, decimalsLimit)
      cleaned = parts.join('.')
    }
  }

  // Handle negative values
  if (!allowNegativeValue) {
    cleaned = cleaned.replaceAll('-', '')
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
export function parseFormattedFloat(value: string): number {
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

  // If cleaned is null/undefined/empty, return 0 to avoid calling replaceAll on null
  if (cleaned === null || cleaned === undefined || cleaned === '') return 0

  const normalized = (typeof options.decimalSeparator === 'string' && options.decimalSeparator !== '')
    // replaceAll the decimal separator with a dot for parsing
    ? cleaned.replaceAll(options.decimalSeparator, '.')
    : cleaned

  const num = Number.parseFloat(normalized)
  return Number.isNaN(num) ? 0 : num
}
