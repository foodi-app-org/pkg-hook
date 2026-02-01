/** Interface for the internal URL structure */
const InternalUrl = {
  origin: 'http://localhost:3000',
  host: 'localhost:3000',
  path: '/api/auth',
  base: 'http://localhost:3000/api/auth',
  toString: function () {
    return this.base
  }
}

/**
 * Function to parse a URL-like object for server-side requests/redirects
 * @param url
 * @returns
 */
function parseUrl (url: string | undefined) {
  const defaultUrl = new URL('http://localhost:3000/api/auth')

  if (url && !url.startsWith('http')) {
    url = `https://${url}`
  }

  const _url = new URL(url || defaultUrl)
  const path = (_url.pathname === '/' ? defaultUrl.pathname : _url.pathname).replace(/\/$/, '')

  const base = `${_url.origin}${path}`

  return {
    origin: _url.origin,
    host: _url.host,
    path,
    base,
    toString: function () {
      return base
    }
  }
}

export { InternalUrl, parseUrl }
