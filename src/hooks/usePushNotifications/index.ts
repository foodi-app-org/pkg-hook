'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  askUserPermission,
  createNotificationSubscription,
  getUserSubscription,
  isPushNotificationSupported,
  registerServiceWorker,
  saveSubscriptionOnPushServer,
  sendPushNotification,
  showLocalNotification,
  type NotificationInfo
} from './helpers/helpers'

export type { NotificationInfo } from './helpers/helpers'

export interface UsePushNotificationsReturn {
  userConsent: NotificationPermission | undefined
  pushNotificationSupported: boolean
  userSubscription: PushSubscription | null
  pushServerSubscriptionId: string | undefined
  error: Error | null
  loading: boolean
  isSubscribed: boolean
  onClickAskUserPermission: () => Promise<void>
  onClickSubscribeToPushNotification: () => Promise<void>
  /** Deprecated typo retained so existing consumers do not break. */
  onClickSusbribeToPushNotification: () => Promise<void>
  onClickSendSubscriptionToPushServer: () => Promise<void>
  onClickSendNotification: (notification?: NotificationInfo) => Promise<void>
  onClickEnablePushNotifications: () => Promise<void>
  onClickShowLocalNotification: (notification?: NotificationInfo) => Promise<void>
  refreshPushState: () => Promise<void>
  clearPushError: () => void
}

/**
 *
 * @param error
 */
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Manages the browser permission, service worker, PushSubscription and backend registration.
 * Call onClickEnablePushNotifications from a user interaction to complete the full setup.
 * 
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  // Keep the first render deterministic for Next.js SSR/hydration.
  const [pushNotificationSupported, setPushNotificationSupported] = useState(false)
  const [userConsent, setUserConsent] = useState<NotificationPermission | undefined>(undefined)
  const [userSubscription, setUserSubscription] = useState<PushSubscription | null>(null)
  const [pushServerSubscriptionId, setPushServerSubscriptionId] = useState<string>()
  const [error, setError] = useState<Error | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const mountedRef = useRef(false)

  const loading = isInitializing || isBusy
  const isSubscribed = Boolean(userSubscription && pushServerSubscriptionId)

  const refreshPushState = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return

    const supported = isPushNotificationSupported()
    setPushNotificationSupported(supported)
    if (!supported) {
      setUserConsent(undefined)
      setUserSubscription(null)
      setPushServerSubscriptionId(undefined)
      return
    }

    setUserConsent(Notification.permission)
    const subscription = await getUserSubscription()
    setUserSubscription(subscription)
  }, [])

  // Register once on mount and discover an existing browser subscription.
  useEffect(() => {
    let cancelled = false
    mountedRef.current = true

    const initialize = async (): Promise<void> => {
      const supported = isPushNotificationSupported()
      if (!cancelled) setPushNotificationSupported(supported)

      if (!supported) {
        if (!cancelled) setIsInitializing(false)
        return
      }

      try {
        if (!cancelled) setUserConsent(Notification.permission)
        await registerServiceWorker()
        const subscription = await getUserSubscription()
        if (!cancelled) setUserSubscription(subscription)
      } catch (cause) {
        if (!cancelled) setError(toError(cause))
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }

    void initialize()

    const syncPermission = (): void => {
      if (!cancelled && typeof Notification !== 'undefined') {
        setUserConsent(Notification.permission)
      }
    }
    window.addEventListener('focus', syncPermission)

    return () => {
      cancelled = true
      mountedRef.current = false
      window.removeEventListener('focus', syncPermission)
    }
  }, [])

  const runAction = useCallback(async (action: () => Promise<void>): Promise<void> => {
    if (mountedRef.current) {
      setIsBusy(true)
      setError(null)
    }
    try {
      await action()
    } catch (cause) {
      if (mountedRef.current) setError(toError(cause))
    } finally {
      if (mountedRef.current) setIsBusy(false)
    }
  }, [])

  const onClickAskUserPermission = useCallback(() => runAction(async () => {
    if (!isPushNotificationSupported()) throw new Error('Las notificaciones no están disponibles en este navegador.')
    const permission = await askUserPermission()
    if (mountedRef.current) setUserConsent(permission)
    if (permission !== 'granted') {
      throw new Error(permission === 'denied'
        ? 'Bloqueaste las notificaciones. Habilítalas desde los permisos del navegador.'
        : 'No se concedió el permiso para enviar notificaciones.')
    }
  }), [runAction])

  const onClickSubscribeToPushNotification = useCallback(() => runAction(async () => {
    if (userConsent !== 'granted' && Notification.permission !== 'granted') {
      throw new Error('Primero debes activar el permiso de notificaciones.')
    }
    const subscription = await createNotificationSubscription()
    if (mountedRef.current) setUserSubscription(subscription)
  }), [runAction, userConsent])

  const onClickSendSubscriptionToPushServer = useCallback(() => runAction(async () => {
    const subscription = userSubscription || await getUserSubscription()
    if (!subscription) throw new Error('No existe una suscripción del navegador. Activa primero las notificaciones.')

    if (mountedRef.current) setUserSubscription(subscription)
    const saved = await saveSubscriptionOnPushServer(subscription)
    if (mountedRef.current) setPushServerSubscriptionId(saved.id)
  }), [runAction, userSubscription])

  const onClickEnablePushNotifications = useCallback(() => runAction(async () => {
    if (!isPushNotificationSupported()) throw new Error('Este navegador o contexto no soporta notificaciones push.')

    let permission = Notification.permission
    if (permission !== 'granted') {
      permission = await askUserPermission()
      if (mountedRef.current) setUserConsent(permission)
    }
    if (permission !== 'granted') {
      throw new Error(permission === 'denied'
        ? 'El permiso está bloqueado. Cámbialo en la configuración del sitio de tu navegador.'
        : 'No se concedió permiso para las notificaciones.')
    }

    await registerServiceWorker()
    const subscription = await createNotificationSubscription()
    if (mountedRef.current) setUserSubscription(subscription)

    // Save immediately so that the backend can send remote notifications.
    const saved = await saveSubscriptionOnPushServer(subscription)
    if (mountedRef.current) {
      setPushServerSubscriptionId(saved.id)
      setUserConsent('granted')
    }
  }), [runAction])

  const onClickSendNotification = useCallback((notification?: NotificationInfo) => runAction(async () => {
    if (!pushServerSubscriptionId) {
      throw new Error('La suscripción no está registrada en el servidor. Activa o sincroniza las notificaciones primero.')
    }
    await sendPushNotification(pushServerSubscriptionId, notification)
  }), [runAction, pushServerSubscriptionId])

  const onClickShowLocalNotification = useCallback((notification?: NotificationInfo) => runAction(async () => {
    await showLocalNotification(notification || {
      title: 'Notificación de prueba',
      description: 'La notificación local funciona correctamente.'
    })
  }), [runAction])

  // Alias for the original misspelled API.
  const onClickSusbribeToPushNotification = onClickSubscribeToPushNotification

  const clearPushError = useCallback(() => setError(null), [])

  return useMemo(() => ({
    userConsent,
    pushNotificationSupported,
    userSubscription,
    pushServerSubscriptionId,
    error,
    loading,
    isSubscribed,
    onClickAskUserPermission,
    onClickSubscribeToPushNotification,
    onClickSusbribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickSendNotification,
    onClickEnablePushNotifications,
    onClickShowLocalNotification,
    refreshPushState,
    clearPushError
  }), [
    userConsent,
    pushNotificationSupported,
    userSubscription,
    pushServerSubscriptionId,
    error,
    loading,
    isSubscribed,
    onClickAskUserPermission,
    onClickSubscribeToPushNotification,
    onClickSusbribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickSendNotification,
    onClickEnablePushNotifications,
    onClickShowLocalNotification,
    refreshPushState,
    clearPushError
  ])
}
