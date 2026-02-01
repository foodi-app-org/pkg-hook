import { apiBaseUrl } from './apiBaseUrl'

/**
 *
 * @param path
 * @param nextAuth
 * @param logger
 * @param req
 * @returns Fetched data or null if an error occurred.
 */

type ReqType = {
  headers?: {
    cookie?: string
    [key: string]: any
  }
  body?: any
}

type LoggerType = {
  error: (msg: string, meta?: any) => void
}

/**
 *
 * @param path
 * @param nextAuth
 * @param logger
 * @param root0
 * @param root0.req
 * @returns Fetched data or null if an error occurred.
 */
async function fetchData(
  path: string,
  nextAuth: any,
  logger: LoggerType,
  { req }: { req?: ReqType } = {}
) {
  const url = `${apiBaseUrl(nextAuth)}/${path}`
  try {
    const options: RequestInit & {
      headers: Record<string, string>
    } = {
      headers: {
        'Content-Type': 'application/json',
        ...(req?.headers?.cookie ? { cookie: req.headers.cookie } : {})
      }
    }

    if (req?.body) {
      options.body = JSON.stringify(req.body)
      options.method = 'POST'
    }

    const res = await fetch(url, options)
    const data = await res.json()
    if (!res.ok) throw data
    return Object.keys(data).length > 0 ? data : null // Return null if data is empty
  } catch (error) {
    logger.error('CLIENT_FETCH_ERROR', { error, url })
    return null
  }
}

export { fetchData }
