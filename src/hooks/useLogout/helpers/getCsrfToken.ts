import { fetchData } from './fetchData'
import _logger, { proxyLogger } from './logger'
import { parseUrl } from './parseUrl'

const __NEXTAUTH = {
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
  _getSession: () => { }
}
const logger = proxyLogger(__NEXTAUTH.basePath, _logger)

/**
 *
 * @param params
 * @param params.callbackUrl
 * @returns A promise that resolves to the CSRF token string or undefined.
 */
// eslint-disable-next-line
export async function getCsrfToken(params: {
  callbackUrl?: string
} = {}): Promise<string | undefined> {
  const response = await fetchData(
    'csrf',
    __NEXTAUTH,
    logger,
    // params
    {}
  )
  return response?.csrfToken
}
