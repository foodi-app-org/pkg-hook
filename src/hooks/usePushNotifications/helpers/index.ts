/* eslint-disable consistent-return */
const pushServerPublicKey = 'BIN2Jc5Vmkmy-S3AUrcMlpKxJpLeVRAfu9WBqUbJ70SJOCWGCGXKY-Xzyh7HDr6KbRDGYHjqZ06OcS3BjD7uAm8'

/**
 * Checks if Push notification and service workers are supported by your browser.
 * @returns {boolean | undefined} True if supported, otherwise undefined.
 */
function isPushNotificationSupported (): boolean | undefined {
  if (globalThis.window !== undefined && globalThis.window.Notification && globalThis.window.ServiceWorker) {
    return 'serviceWorker' in navigator && 'PushManager' in globalThis.window
  }
}

/**
 * Asks user consent to receive push notifications and returns the response of the user, one of granted, default, denied.
 * @returns {Promise<NotificationPermission>} The user's permission response.
 */
async function askUserPermission (): Promise<NotificationPermission> {
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

const host = 'http://localhost:4000'

/**
 * Sends a POST request.
 * @param {string} path The API path.
 * @param {unknown} body The request body.
 * @returns {Promise<any>} The response data.
 */
async function post (path: string, body: unknown): Promise<any> {
  const response = await fetch(`${host}${path}`, {
    body: JSON.stringify(body),
    method: 'POST',
    mode: 'cors'
  })
  const data = await response.json()
  return data
}

/**
 * Sends a GET request.
 * @param {string} path The API path.
 * @returns {Promise<any>} The response data.
 */
async function get (path: string): Promise<any> {
  const response = await fetch(`${host}${path}`, {
    method: 'GET',
    mode: 'cors'
  })
  const data = await response.json()
  return data
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
