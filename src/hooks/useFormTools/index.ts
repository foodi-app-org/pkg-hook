import {
  useCallback,
  useEffect,
  useState
} from 'react'

import { validationSubmitHooks } from '../../utils'


interface UseFormToolsProps {
  initialValues?: Record<string, any>;
  sendNotification?: ({
    title,
    description,
    backgroundColor
  }: {
    title?: string;
    description?: string;
    backgroundColor?: string;
  }) => void;
}

/**
 * @param root0
 * @param root0.initialValues
 * @param root0.sendNotification
 * @version 0.0.1
 * @description Hook con herramientas de validación y eventos de cambio
 * @return {Array} devuelve la función onChange a ejecutar y el estado de error de cada input
 */
export const useFormTools = ({
  initialValues = {},
  sendNotification = ({
    title = '',
    description = '',
    backgroundColor = ''
  }) => {
    console.log({ title, description, backgroundColor })
  }
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
    actionAfterSuccess = () => { }
  }: {
    event: React.FormEvent<HTMLFormElement>,
    msgError?: string,
    msgSuccess?: string,
    action?: () => Promise<any>,
    actionAfterSuccess?: () => void
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
    const errores = validationSubmitHooks(event.currentTarget.elements)
    setErrorForm(errores)
    for (const x in errores) {
      // @ts-ignore
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
              title: msgSuccess ?? 'Operación exitosa',
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
    return setCalledSubmit(false)
  },
  [])

  return [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm, errorSubmit, calledSubmit, setForcedError }]
}
