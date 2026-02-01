import { apiBaseUrl } from './apiBaseUrl'
import { BroadcastChannel } from './BroadcastChannel'
import { getCsrfToken } from './getCsrfToken'
import { parseUrl } from './parseUrl'

const broadcast = BroadcastChannel()

export const __NEXTAUTH = {
  baseUrl: parseUrl(process.env.NEXTAUTH_URL || process.env.VERCEL_URL).origin,
  basePath: parseUrl(process.env.NEXTAUTH_URL).path,
  baseUrlServer: parseUrl(
    process.env.NEXTAUTH_URL_INTERNAL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL
  ).origin,
  basePathServer: parseUrl(
    process.env.NEXTAUTH_URL_INTERNAL || process.env.NEXTAUTH_URL
  ).path,
  _lastSync: 0,
  _session: undefined,
  // Mock function to be replaced at runtime
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _getSession: (_p0?: { event: string }) => Promise.resolve()
}

/**
 *
 * @param options
 * @param options.callbackUrl URL a la que redirigir después del cierre de sesión
 * @param options.redirect Si es true, redirige a la URL de callback después del cierre de sesión
 * @param options.reload Si es true, recarga la página después del cierre de sesión
 * @returns {Promise<{ url: string } | void>} Si no se redirige, devuelve un objeto con la URL de redirección
 * @description Función para cerrar la sesión del usuario
 */
export async function signOutAuth(options: {
  callbackUrl?: string
  redirect?: boolean
  reload?: boolean
} | undefined = undefined
): Promise<{ url: string } | void> {
  const currentHref = globalThis.location.href
  const { callbackUrl = currentHref, reload = true } = options ?? {}
  const baseUrl = apiBaseUrl(__NEXTAUTH)
  const fetchOptions = {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    // @ts-expect-error getCsrfToken returns a Promise, but URLSearchParams expects a string
    body: new URLSearchParams({
      csrfToken: await getCsrfToken(),
      callbackUrl,
      json: true
    })
  }
  const res = await fetch(`${baseUrl}/signout`, fetchOptions)
  const data = await res.json()

  broadcast.post({ event: 'session', data: { trigger: 'signout' } })
  if (!reload) {
    await __NEXTAUTH._getSession()
    return data
  }
  if (options?.redirect ?? true) {
    const url = data.url ?? callbackUrl
    const { location } = globalThis
    location.href = url
    // If url contains a hash, the browser does not reload the page. We reload manually
    if (url.includes('#') && !reload) location.reload()
    return undefined
  }
  await __NEXTAUTH._getSession({ event: 'storage' })
  return data
}
