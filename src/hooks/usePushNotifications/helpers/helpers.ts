export type NotificationInfo = {
  title?: string
  /** Text displayed below the notification title. */
  description?: string
  body?: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  /** Relative path in your own application, e.g. '/orders'. */
  url?: string
}

export type PushSubscriptionResponse = {
  id: string
}

const DEFAULT_API_URL = 'http://localhost:4000'
const API_URL = (process.env.NEXT_PUBLIC_PUSH_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

/** Push APIs require a secure context; localhost is considered secure by browsers. */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const secureContext = window.isSecureContext || ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

  return Boolean(
    secureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }

  return output
}

export async function askUserPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    throw new Error('Este navegador no permite mostrar notificaciones.')
  }

  return Notification.requestPermission()
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushNotificationSupported()) {
    throw new Error('Las notificaciones push no están disponibles en este navegador o contexto.')
  }

  return navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
  })
}

export async function getUserSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function createNotificationSubscription(): Promise<PushSubscription> {
  if (!isPushNotificationSupported()) {
    throw new Error('Las notificaciones push no están disponibles en este navegador.')
  }

  if (Notification.permission !== 'granted') {
    throw new Error('Primero debes permitir las notificaciones en el navegador.')
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY en las variables de entorno.')
  }

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) return existingSubscription

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  })
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`${init.method || 'GET'} ${path}: ${response.status}${detail ? ` — ${detail}` : ''}`)
  }

  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export function post<T = unknown>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export function get<T = unknown>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

/** Saves/upserts a subscription in the application backend. */
export async function saveSubscriptionOnPushServer(subscription: PushSubscription): Promise<PushSubscriptionResponse> {
  const response = await post<PushSubscriptionResponse>('/subscription2', subscription.toJSON())

  if (!response || typeof response.id !== 'string' || response.id.length === 0) {
    throw new Error('El servidor de notificaciones no devolvió un id de suscripción válido.')
  }

  return response
}

/** Asks the backend to send a push. The private VAPID key must stay on the backend. */
export async function sendPushNotification(
  subscriptionId: string,
  notification?: NotificationInfo
): Promise<void> {
  const id = encodeURIComponent(subscriptionId)

  if (notification) {
    await post(`/subscription/${id}/notify`, {
      title: notification.title || 'Notificación',
      body: notification.body || notification.description || '',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/badge-72x72.png',
      image: notification.image,
      tag: notification.tag || 'app-notification',
      url: notification.url || '/'
    })
    return
  }

  // Legacy endpoint retained for compatibility with the original API.
  await get(`/subscription/${id}`)
}

/** Shows a local notification from the current page; this does not send a remote push. */
export async function showLocalNotification(info: NotificationInfo): Promise<void> {
  if (!isPushNotificationSupported()) {
    throw new Error('Este navegador no permite mostrar notificaciones.')
  }
  if (Notification.permission !== 'granted') {
    throw new Error('Debes permitir las notificaciones antes de mostrar una.')
  }

  const registration = await navigator.serviceWorker.ready
  const options: NotificationOptions & { image?: string } = {
    body: info.body || info.description || '',
    icon: info.icon || '/icons/icon-192x192.png',
    badge: info.badge || '/icons/badge-72x72.png',
    tag: info.tag || 'local-notification',
    data: { url: info.url || '/' }
  }
  if (info.image) options.image = info.image

  await registration.showNotification(info.title || 'Notificación', options)
}
