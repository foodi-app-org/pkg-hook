import { apiBaseUrl } from './apiBaseUrl'

async function fetchData (path, __NEXTAUTH, logger, { ctx, req } = {}) {
  const url = `${apiBaseUrl(__NEXTAUTH)}/${path}`
  try {
    const options = {
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
