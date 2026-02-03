 
const pushServerPublicKey = 'BIN2Jc5Vmkmy-S3AUrcMlpKxJpLeVRAfu9WBqUbJ70SJOCWGCGXKY-Xzyh7HDr6KbRDGYHjqZ06OcS3BjD7uAm8'

/**
 * Checks if Push notifications and Service Workers are supported in the current environment.
 * @returns {boolean} True if supported, otherwise false.
 */
function isPushNotificationSupported(): boolean {
  if (globalThis.window === undefined) return false
  return 'serviceWorker' in navigator && 'PushManager' in globalThis.window && 'Notification' in globalThis.window
}

/**
 * Asks the user for permission to display notifications.
 * @returns {Promise<NotificationPermission>} One of 'granted' | 'denied' | 'default'
 */
async function askUserPermission(): Promise<NotificationPermission> {
  return Notification.requestPermission()
}

/**
 * Shows a notification.
 * @returns {void}
 */
function sendNotification (): void {
  const img = '/images/jason-leung-HM6TMmevbZQ-unsplash.jpg'
  const text = 'Take a look at this brand new t-shirt!'
  const title = 'New Product Available'
  const options = {
    body: text,
    icon: '/images/jason-leung-HM6TMmevbZQ-unsplash.jpg',
    vibrate: [200, 100, 200],
    tag: 'new-product',
    image: img,
    badge: 'https://spyna.it/icons/android-icon-192x192.png',
    actions: [{ action: 'Detail', title: 'View', icon: 'https://via.placeholder.com/128/ff0000' }]
  }
  navigator.serviceWorker.ready.then(function (serviceWorker) {
    serviceWorker.showNotification(title, options)
  })
}

/**
 * Registers the service worker.
 * @returns {Promise<ServiceWorkerRegistration>} The service worker registration promise.
 */
function registerServiceWorker (): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register('/sw.js')
}

/**
 * Using the registered service worker creates a push notification subscription and returns it.
 * @returns {Promise<PushSubscription>} The push subscription.
 */
async function createNotificationSubscription (): Promise<PushSubscription> {
  // wait for service worker installation to be ready
  const serviceWorker = await navigator.serviceWorker.ready
  // subscribe and return the subscription
  return serviceWorker.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: pushServerPublicKey
  })
}

/**
 * Returns the subscription if present or nothing.
 * @returns {Promise<PushSubscription | null>} The user's push subscription or null.
 */
async function getUserSubscription (): Promise<PushSubscription | null> {
  // wait for service worker installation to be ready, and then
  const serviceWorker = await navigator.serviceWorker.ready
  const pushSubscription = await serviceWorker.pushManager.getSubscription()
  return pushSubscription
}

const HOST = 'http://localhost:4000'
/**
 * Generic POST helper.
 * @template T
 * @param {string} path
 * @param {unknown} body
 * @param {string} [baseHost]
 * @returns {Promise<T>}
 */
async function post<T = unknown>(path: string, body: unknown, baseHost = HOST): Promise<T> {
  const response = await fetch(`${baseHost}${path}`, {
    body: JSON.stringify(body),
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`POST ${path} failed: ${response.status} ${text}`)
  }
  return (await response.json()) as T
}

/**
 * Generic GET helper.
 * @template T
 * @param {string} path
 * @param {string} [baseHost]
 * @returns {Promise<T>}
 */
async function get<T = unknown>(path: string, baseHost = HOST): Promise<T> {
  const response = await fetch(`${baseHost}${path}`, {
    method: 'GET',
    mode: 'cors'
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GET ${path} failed: ${response.status} ${text}`)
  }
  return (await response.json()) as T
}

export {
  isPushNotificationSupported,
  askUserPermission,
  post,
  get,
  registerServiceWorker,
  sendNotification,
  createNotificationSubscription,
  getUserSubscription
}
