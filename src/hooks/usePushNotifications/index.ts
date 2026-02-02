// usePushNotifications.tsx
import { useEffect, useState } from 'react'
import {
  isPushNotificationSupported,
  post,
  get,
  askUserPermission,
  registerServiceWorker,
  createNotificationSubscription,
  getUserSubscription
} from './helpers'

/**
 * Notification payload used by external callbacks (if any)
 */
export type NotificationInfo = {
  title?: string
  description?: string
  backgroundColor?: string
}

/**
 * Hook return shape
 */
export type UsePushNotificationsReturn = {
  onClickAskUserPermission: () => Promise<void>
  onClickSusbribeToPushNotification: () => Promise<void>
  onClickSendSubscriptionToPushServer: () => Promise<void>
  onClickSendNotification: () => Promise<void>
  pushServerSubscriptionId?: string
  userConsent?: NotificationPermission
  pushNotificationSupported: boolean
  userSubscription: PushSubscription | null
  error?: Error | null
  loading: boolean
}

/**
 * Custom hook that manages browser push notification flow.
 *
 * @returns UsePushNotificationsReturn
 */
export const usePushNotifications = (): UsePushNotificationsReturn => {
  const pushNotificationSupported = isPushNotificationSupported()

  // userConsent will be one of 'granted' | 'denied' | 'default' | undefined
  const [userConsent, setUserConsent] = useState<NotificationPermission | undefined>(() => {
    try {
      return typeof Notification !== 'undefined' ? Notification.permission : undefined
    } catch {
      return undefined
    }
  })

  const [userSubscription, setUserSubscription] = useState<PushSubscription | null>(null)
  const [pushServerSubscriptionId, setPushServerSubscriptionId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Register service worker if supported
  useEffect(() => {
    if (!pushNotificationSupported) return
    setLoading(true)
    setError(null)
    registerServiceWorker()
      .catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => setLoading(false))
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get existing subscription if any
  useEffect(() => {
    if (!pushNotificationSupported) return
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const existing = await getUserSubscription()
        setUserSubscription(existing)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    })()
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Ask for user permission to show notifications.
   */
  const onClickAskUserPermission = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const consent = await askUserPermission()
      setUserConsent(consent)
      if (consent !== 'granted') {
        setError(new Error('User denied notification permission'))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create a PushSubscription via the service worker's PushManager.
   */
  const onClickSusbribeToPushNotification = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const subscription = await createNotificationSubscription()
      setUserSubscription(subscription)
    } catch (err) {
      console.error("Couldn't create the notification subscription", err)
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Send the subscription object to the push server (persist it).
   */
  const onClickSendSubscriptionToPushServer = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      if (!userSubscription) throw new Error('No push subscription available to send')
      const body = userSubscription.toJSON()
      const resp = await post<{ id: string }>('/subscription2', body)
      setPushServerSubscriptionId(resp.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Ask push server to trigger a notification for the saved subscription id.
   */
  const onClickSendNotification = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      if (!pushServerSubscriptionId) throw new Error('No server subscription id available')
      await get(`/subscription/${pushServerSubscriptionId}`)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }

  return {
    onClickAskUserPermission,
    onClickSusbribeToPushNotification,
    onClickSendSubscriptionToPushServer,
    onClickSendNotification,
    pushServerSubscriptionId,
    userConsent,
    pushNotificationSupported,
    userSubscription,
    error,
    loading
  }
}
