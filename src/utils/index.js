/**
 * @description It takes an array of elements and returns an object with a submit hook for each element.
 * @version 0.1.1
 * @param {array} elements elementos del formulario
 * @return {array} devuelve un array de booleanos con el nombre identificador para cada estado en react.
 */
export const validationSubmitHooks = elements => {
    let errorForm = {}
    for (const element of elements) {
      if (element.name) {
        if (element.type === 'text' || element.type === 'password' || element.type === 'email' || element.type === 'number' || element.type === 'hidden') {
          if (element.dataset.required === 'true') {
            if (!element.value) errorForm = { ...errorForm, [element.name]: !element.value }
            else errorForm = { ...errorForm, [element.name]: !element.value }
          } else {
            errorForm = { ...errorForm, [element.name]: false }
          }
        }
      }
    }
    return errorForm
  }

  export const getCurrentDomain = () => {
    return typeof window !== 'undefined' && window.location.hostname.split('.').slice(-2).join('.')
  }

  export function RandomCode(length) {
    let result = ''
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let charactersLength = characters.length
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() *
        charactersLength))
    }
    return result
  }
  /**
 * actualizar cache de apollo
 * @param {{ cache: object, query: object, nameFun: string, dataNew: object, type: number, id: string }} params Parámetros para actualizar el cachet de apollo
 * @returns {null} no hay retorno
 */
export const updateCacheMod = async ({ cache, query, nameFun, dataNew, type, id }) => {
  return cache.modify({
    fields: {
      [nameFun](dataOld = []) {
        if (type === 1) return cache.writeQuery({ query, data: [...(dataOld || []), { ...(dataNew || {}) }] })
        if (type === 2) return cache.writeQuery({ query, data: { ...(dataOld || {}), ...(dataNew || {}) } })
        if (type === 3) return cache.writeQuery({ query, data: dataOld.filter(x => { return x === id }) })
      }
    }
  })
}
export const initializer = (initialValue = initialState) => { return JSON.parse(localStorage.getItem(process.env.LOCAL_SALES_STORE)) || initialValue }


export const numberFormat = value => { return value ? (parseInt(value) ? new Intl.NumberFormat('de-DE').format(parseFloat(`${value}`.replace(/\./g, ''))) : value) : (value) }



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
  0:'Enero',
  1:'Febrero',
  2:'Marzo',
  3:'Abril',
  4:'Mayo',
  5:'Junio',
  6:'Julio',
  7:'Augosto',
  8:'Septiembre',
  9:'Octubre',
  10:'Noviembre ',
  11:'Diciembre'
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
