import {
  useCallback,
  useEffect,
  useState
} from 'react'

import { validationSubmitHooks } from '../../utils'

import type { SendNotificationFn } from 'typesdefs';



interface UseFormToolsProps {
  initialValues?: Record<string, any>;
  sendNotification?: SendNotificationFn;
  callback?: () => void;
}

/**
 * @param root0
 * @param root0.initialValues
 * @param root0.sendNotification
 * @param root0.callback
 * @version 0.0.1
 * @description Hook con herramientas de validación y eventos de cambio
 * @returns {Array} devuelve la función onChange a ejecutar y el estado de error de cada input
 */
export const useFormTools = ({
  initialValues = {},
  sendNotification,
  callback
}: UseFormToolsProps = {}) => {
  const [dataForm, setDataForm] = useState<Record<string, any>>({ ...initialValues })
  const [errorForm, setErrorForm] = useState<Record<string, boolean>>({})
  const [errorSubmit, setErrorSubmit] = useState(false)
  const [calledSubmit, setCalledSubmit] = useState(false)
  // Handle Change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, error: boolean) => {
    setDataForm({ ...dataForm, [e.target.name]: e.target.value })
    setErrorForm({ ...errorForm, [e.target.name]: error })
  }, [setDataForm, dataForm, errorForm, setErrorForm])

  // Forzar datos desde una ventana externa
  const handleForcedData = useCallback((data: Record<string, any>) => {
    setDataForm(data)
  }, [setDataForm])

  // Forzar datos de error desde una ventana externa
  const setForcedError = useCallback((errors: Record<string, boolean>) => {
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
    actionAfterSuccess = () => { return undefined },
    actionAfterCheck = () => { return undefined }
  }: {
    event: React.FormEvent<HTMLFormElement>,
    msgError?: string,
    msgSuccess?: string,
    action?: () => Promise<any>,
    actionAfterSuccess?: () => void,
    actionAfterCheck?: () => void
  }) => {
    event.preventDefault()
    setCalledSubmit(true)
    if (typeof actionAfterCheck === 'function') {
      actionAfterCheck()
    }
    let errSub = false

    // Valida los errores locales
    for (const x in errorForm) {
      if (errorForm[x]) errSub = true
    }
    if (errSub) {
      sendNotification?.({
        description: 'Completa los campos requeridos',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
    if (errors) {
      setErrorSubmit(true)
      setForcedError({ ...errorForm })
      return undefined
    }

    if (errSub) {
      setErrorSubmit(errSub)
      return undefined
    }



    // Valida los errores desde el evento
    const errores = validationSubmitHooks(event.currentTarget.elements as any)
    setErrorForm(errores)
    for (const x in errores) {
      if (errores[x]) errSub = true
    }
    if (errSub) {
      setErrorSubmit(errSub)
      return undefined
    }


    // Ejecuta la accion si es válido sss
    if (!errSub && typeof action === 'function') {
      const result = action()
      if (result && typeof result.then === 'function') {
        result.then((res) => {
          if (res) {
            sendNotification?.({
              title: msgSuccess ?? 'Operación exitosa',
              description: 'Operación exitosa',
              backgroundColor: 'success'
            })
            if (actionAfterSuccess) actionAfterSuccess()
          }
        }).catch((e) => {
          if (typeof sendNotification === 'function') {
            sendNotification({
              title: msgError || e?.message || 'Ha ocurrido un error',
              description: msgError || e?.message || 'Ha ocurrido un error',
              backgroundColor: 'error'
            })
          }
        })
      }
    }

    setErrorSubmit(errSub)
    return undefined
  }

  useEffect(() => { return setCalledSubmit(false) }, [calledSubmit])
  useEffect(() => {
    if (typeof callback === 'function') {
      callback()
    }
    return setCalledSubmit(false)
  }, [])

  return [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm, errorSubmit, calledSubmit, setForcedError }]
}
