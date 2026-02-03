import { useEffect } from 'react'

type Callback = (event: Event) => void

interface EventCallbackParams {
  eventType: string
  callBack: Callback
}

interface TriggerParams {
  eventType: string
  data?: any
}

export const on = ({ eventType, callBack }: EventCallbackParams): void => {
  document.addEventListener(eventType, callBack)
}
export const off = ({ eventType, callBack }: EventCallbackParams): void => {
  document.removeEventListener(eventType, callBack)
}
export const once = ({ eventType, callBack }: EventCallbackParams): void => {
  const handleEventOnce = (event: Event): void => {
    callBack(event)
    off({ eventType, callBack: handleEventOnce })
  }
  on({ eventType, callBack: handleEventOnce })
}
export const trigger = ({ eventType, data }: TriggerParams): void => {
  const event = new CustomEvent(eventType, { detail: data })
  document.dispatchEvent(event)
}
// This function is used to subscribe components an any event
export const useEvents = ({ eventType, callBack }: EventCallbackParams): void => {
  useEffect(() => {
    on({ eventType, callBack })
    return () => {
      off({ eventType, callBack })
    }
  }, [eventType, callBack])
}
// This function create and dispatch event
export const useTriggerEvent = () => {
  return {
    trigger
  }
}
