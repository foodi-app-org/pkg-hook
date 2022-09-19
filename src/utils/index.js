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
  