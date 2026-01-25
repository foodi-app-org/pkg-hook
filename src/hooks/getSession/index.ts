import { Cookies } from "../../cookies"

/**
 * Decodes a JWT safely without verifying signature.
 * Use ONLY for reading payload data.
 *
 * @param {string} token - JWT string
 * @returns {Record<string, any> | null}
 */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Gets session data from cookie "session".
 * Designed for Next.js 15 App Router (server-side).
 *
 * @returns {Promise<{
 *   isSession: boolean
 *   token?: string
 *   user?: Record<string, any>
 *   deviceid?: string
 *   error?: string
 * }>}
 */
export const getSession = async () => {
  try {
    const token = Cookies.get('session')
    return new Promise((resolve) => {
      if (!token) {
        resolve({ isSession: false })
        return
      } 
      const payload = decodeJwtPayload(token)
      if (!payload) {
        resolve({ isSession: false })
        return
      }
      const { user, deviceid, exp } = payload
      const currentTime = Math.floor(Date.now() / 1000)
      if (exp && currentTime >= exp) {
        resolve({ isSession: false })
        return
      }
      resolve({
        isSession: true,
        token,
        user,
        deviceid
      })
    })
  } catch (error) {
    return {
      isSession: false,
      error: 'Unexpected session error'
    }
  }
}
