import { useEffect } from 'react'

export const on = ({ eventType, callBack }) => {
  document.addEventListener(eventType, callBack)
}
export const off = ({ eventType, callBack }) => {
  document.removeEventListener(eventType, callBack)
}
export const once = ({ eventType, callBack }) => {
  const handleEventOnce = (event) => {
    callBack(event)
    off({ eventType, callBack: handleEventOnce })
  }
  on({ eventType, callBack: handleEventOnce })
}
export const trigger = ({ eventType, data }) => {
  const event = new CustomEvent(eventType, { detail: data })
  document.dispatchEvent(event)
}
// This function is used to subscribe components an any event
export const useEvents = ({ eventType, callBack }) => {
  useEffect(() => {
    on({ eventType, callBack })
    return () => {
      off({ eventType, callBack })
    }
  }, [eventType, callBack])
}
// This function create and dispatch event
export const useTrigerEvent = () => {
  return {
    trigger
  }
}
