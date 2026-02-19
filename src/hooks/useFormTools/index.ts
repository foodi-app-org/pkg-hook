// hooks/useFormTools.tsx
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
  /**
   * Callback opcional que recibe el estado disabled (true = hay errores)
   * y el step (si se pudo determinar).
   */
  onValidityChange?: (disabled: boolean, step?: number | string) => void;
}

export const useFormTools = ({
  initialValues = {},
  sendNotification,
  callback,
  onValidityChange
}: UseFormToolsProps = {}) => {
  const [dataForm, setDataForm] = useState<Record<string, any>>({ ...initialValues })
  const [errorForm, setErrorForm] = useState<Record<string, boolean>>({})
  const [errorSubmit, setErrorSubmit] = useState(false)
  const [calledSubmit, setCalledSubmit] = useState(false)

  // Estado que indica si el paso actual (o el form) está inválido -> útil para deshabilitar botones
  const [disabled, setDisabled] = useState<boolean>(true)

  // Helper interno para actualizar el estado disabled y notificar al callback
  const updateDisabledState = useCallback((isDisabled: boolean, step?: number | string) => {
    setDisabled(isDisabled)
    if (typeof onValidityChange === 'function') {
      try {
        onValidityChange(isDisabled, step)
      } catch (e) {
        if (typeof console !== 'undefined' && typeof console.warn === 'function') {
          console.warn('onValidityChange error', e)
        }
        // no bloquear si el callback falla
        // console.warn('onValidityChange error', e)
      }
    }
  }, [onValidityChange])

  // Handle Change - ahora además valida el step correspondiente (si puede) y actualiza `disabled`
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, error: boolean) => {
    const target = e.target as HTMLInputElement
    setDataForm(prev => ({ ...prev, [target.name]: target.value }))
    setErrorForm(prev => ({ ...prev, [target.name]: error }))

    // Intentamos obtener el formulario asociado al input para hacer validación live
    const form = (target.form as HTMLFormElement | null)
    // Intentamos determinar el step desde el input (data-required-step)
    const stepFromDataset = (target as HTMLElement).dataset?.requiredStep
    const step = typeof stepFromDataset !== 'undefined' ? stepFromDataset : undefined

    if (form && form.elements) {
      // Validamos sólo el step (o global si step es undefined)
      const errores = validationSubmitHooks(form.elements as any, step)
      // Mergeamos errores con los existentes
      setErrorForm(prev => ({ ...prev, ...errores }))

      const hasError = Object.values(errores).some(Boolean)
      updateDisabledState(hasError, step)
    } else {
      // Si no hay form disponible, no podemos validar por elementos -> no tocar disabled
      // (podrías decidir invalidarlo hasta que haya validación completa)
    }
  }, [updateDisabledState])

  // Forzar datos desde una ventana externa
  const handleForcedData = useCallback((data: Record<string, any>) => {
    setDataForm(data)
  }, [])

  // Forzar datos de error desde una ventana externa
  const setForcedError = useCallback((errors: Record<string, boolean>) => {
    setErrorForm(errors)
  }, [])

  // Handle submit, al enviar formulario
  const listErrors = Object.values(errorForm)
  const errors = listErrors.find((error) => error === true)

  const handleSubmit = (params: {
    event: React.FormEvent<HTMLFormElement>,
    msgError?: string,
    msgSuccess?: string,
    action?: () => Promise<any>,
    actionAfterSuccess?: () => void,
    actionAfterCheck?: () => void
  }) => {
    const {
      event,
      msgError = '',
      msgSuccess,
      action = () => { return Promise.resolve() },
      actionAfterSuccess = () => { return undefined },
      actionAfterCheck = () => { return undefined }
    } = params

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

    // Valida los errores desde el evento (valida TODO el form)
    const errores = validationSubmitHooks(event.currentTarget.elements as any)
    setErrorForm(errores)
    for (const x in errores) {
      if (errores[x]) errSub = true
    }
    if (errSub) {
      setErrorSubmit(errSub)
      // actualizar estado disabled global
      const hasError = Object.values(errores).some(Boolean)
      updateDisabledState(hasError)
      return undefined
    }

    // Ejecuta la accion si es válido
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
    // actualizar estado disabled global (no hay errores)
    updateDisabledState(errSub)
    return undefined
  }

  /**
   * validateStep:
   * - Uso recomendado: llamarlo desde un handler que tenga acceso al event del form (ej: botón "Siguiente" o onSubmit parcial)
   * - validateStep(event, step) -> devuelve true si no hay errores en ese step
   */
  const validateStep = useCallback((event: React.FormEvent<HTMLFormElement>, step: number | string) => {
    // Usamos event.currentTarget.elements como pediste
    const elements = event.currentTarget.elements
    const errores = validationSubmitHooks(elements as any, step)
    setErrorForm(prev => ({ ...prev, ...errores }))

    const hasError = Object.values(errores).some(Boolean)
    if (hasError) {
      sendNotification?.({
        title: 'Error',
        description: 'Completa los campos requeridos de este paso',
        backgroundColor: 'error'
      })
    }

    updateDisabledState(hasError, step)
    return !hasError
  }, [setErrorForm, sendNotification, updateDisabledState])

  useEffect(() => { setCalledSubmit(false) }, [calledSubmit])
  useEffect(() => {
    if (typeof callback === 'function') {
      callback()
    }
    setCalledSubmit(false)
    // si quieres calcular el estado disabled inicial, podrías hacerlo aquí
  }, [])

  return [
    handleChange,
    handleSubmit,
    handleForcedData,
    { dataForm, errorForm, errorSubmit, calledSubmit, setForcedError, validateStep, disabled }
  ] as const
}