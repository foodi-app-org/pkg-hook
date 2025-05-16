import {
  useCallback,
  useEffect,
  useState
} from 'react'
import { validationSubmitHooks } from '../../utils'
/**
 * @typedef {Object} FormTools
 * @property {function} handleChange - Función para manejar el cambio de los inputs
 * @property {function} handleSubmit - Función para manejar el envío del formulario
 * @property {function} handleForcedData - Función para forzar el cambio de los inputs
 * @property {function} setForcedError - Función para forzar el error de los inputs
 * @property {Object} dataForm - Objeto con los datos del formulario
 * @property {Object} errorForm - Objeto con los errores del formulario
 * @property {boolean} errorSubmit - Estado de error del formulario
 * @property {boolean} calledSubmit - Estado de envío del formulario
 * @property {function} setErrorForm - Función para establecer el error del formulario
 * @version 0.0.1
 * @description Hook con herramientas de validación y eventos de cambio
 * @return {Array} devuelve la función onChange a ejecutar y el estado de error de cada input
 */
export const useFormTools = ({
  callback = () => { },
  sendNotification = ({
    title = '',
    description = '',
    backgroundColor = ''
  }) => { }
}
= {}) => {
  const [dataForm, setDataForm] = useState({})
  const [errorForm, setErrorForm] = useState({})
  const [errorSubmit, setErrorSubmit] = useState(false)
  const [calledSubmit, setCalledSubmit] = useState(false)
  // Handle Change
  const handleChange = useCallback((e, error) => {
    setDataForm({ ...dataForm, [e.target.name]: e.target.value })
    setErrorForm({ ...errorForm, [e.target.name]: error })
  }, [setDataForm, dataForm, errorForm, setErrorForm])

  // Forzar datos desde una ventana externa
  const handleForcedData = useCallback(data => {
    setDataForm(data)
  }, [setDataForm])

  // Forzar datos de error desde una ventana externa
  const setForcedError = useCallback(errors => {
    setErrorForm(errors)
  }, [setErrorForm])

  // Handle submit, al enviar formulario
  const listErrors = Object.values(errorForm)
  const errors = listErrors.find((error) => {
    return error === true
  })

  const handleSubmit = ({
    event,
    msgError = '',
    msgSuccess,
    action = () => { return Promise.resolve() },
    actionAfterSuccess = () => { }
  }) => {
    event.preventDefault()
    setCalledSubmit(true)
    let errSub = false

    // Valida los errores locales
    for (const x in errorForm) {
      if (errorForm[x]) errSub = true
    }
    if (errSub) {
      sendNotification({
        description: 'Completa los campos requeridos',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
    if (errors) {
      setErrorSubmit(true)
      return setForcedError({ ...errorForm })
    }

    if (errSub) return setErrorSubmit(errSub)

    // Valida los errores desde el evento
    const errores = validationSubmitHooks(event.target.elements)
    setErrorForm(errores)
    for (const x in errores) {
      if (errores[x]) errSub = true
    }
    if (errSub) return setErrorSubmit(errSub)

    // Ejecuta la accion si es válido
    if (!errSub && typeof action === 'function') {
      const result = action()
      if (result && typeof result.then === 'function') {
        result.then((res) => {
          if (res) {
            sendNotification({
              message: msgSuccess ?? 'Operación exitosa',
              description: 'Operación exitosa',
              backgroundColor: 'success'
            })
            if (actionAfterSuccess) actionAfterSuccess()
          }
        }).catch((e) => {
          sendNotification({
            title: msgError || e?.message || 'Ha ocurrido un error',
            backgroundColor: 'error'
          })
        })
      }
    }

    setErrorSubmit(errSub)
  }

  useEffect(() => { return setCalledSubmit(false) }, [calledSubmit])
  useEffect(() => {
    if (typeof callback === 'function' && !errorSubmit) {
      callback(dataForm)
    }
    return setCalledSubmit(false)
  },
  [])

  return [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm, errorSubmit, calledSubmit, setForcedError }]
}
