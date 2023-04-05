import {
  useCallback,
  useEffect,
  useState
} from 'react'
import { validationSubmitHooks } from '../../utils'
/**
 * @version 0.0.1
 * @description Hook con herramientas de validación y eventos de cambio
 * @return {Array} devuelve la función onChange a ejecutar y el estado de error de cada input
 */
export const useFormTools = ({ sendNotification = () => { } } = {}) => {
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

  const handleSubmit = useCallback(({ event, action, msgSuccess, msgError, actionAfterSuccess }) => {
    event.preventDefault()
    console.log(event)
    setCalledSubmit(true)
    let errSub = false

    // Valida los errores locales
    for (const x in errorForm) {
      if (errorForm[x]) errSub = true
    }

    if (errors) {
      setErrorSubmit(true)
    return setForcedError({ ...errorForm })
  }

    if (errSub) return setErrorSubmit(errSub)

    // Valida los errores desde el evento
    const errores = validationSubmitHooks(event.target.elements)
    console.log({errores})
    setErrorForm(errores)
    for (const x in errores) {
      if (errores[x]) errSub = true
    }

    // Ejecuta la petición si es válido
    if (!errSub && action) {
      action().then(res => {
        if (res) {
          sendNotification({ message: msgSuccess || 'Operación exitosa', description: 'Operación exitosa', color: PColor })
          !!actionAfterSuccess && actionAfterSuccess()
        }

      }).catch(e => {return sendNotification({ title: msgError || e?.message || 'Ha ocurrido un error', color: WColor })})
    }

    setErrorSubmit(errSub)
  }, [errorForm, setErrorForm])

  useEffect(() => {return setCalledSubmit(false)}, [calledSubmit])
  useEffect(() => {
    return setCalledSubmit(false)},
  [])

  return [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm, errorSubmit, calledSubmit, setForcedError }]
}