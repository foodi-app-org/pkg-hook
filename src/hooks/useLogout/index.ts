import { useApolloClient } from '@apollo/client'
import { useState } from 'react'
import { SetAlertBoxFn } from 'typesdefs'

import { Cookies } from '../../cookies/index'
import { getCurrentDomain } from '../../utils'

import { signOutAuth } from './helpers'

/**
 * Options for the hook.
 */
export interface UseLogoutOptions {
  setAlertBox?: SetAlertBoxFn
}

export type LogoutParams = {
  redirect?: boolean
  refresh?: boolean
}

export type UseLogoutReturn = {
  onClickLogout: (params?: LogoutParams) => Promise<void>
  loading: boolean
  error: boolean
}

/**
 * useLogout hook
 *
 * @param {UseLogoutOptions} options - Optional callbacks and behavior overrides.
 * @returns {UseLogoutReturn} - logout function and state.
 */
export const useLogout = ({
  setAlertBox = ({ message }: { message: string }) => ({ message })
}: UseLogoutOptions = {}): UseLogoutReturn => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)
  const client = useApolloClient()

  /**
   * Remove a single cookie taking domain into account.
   * @param {string} cookieName
   */
  const eliminarCookie = async (cookieName: string): Promise<void> => {
    try {
      let domain = getCurrentDomain() as string | undefined

      // If running on localhost, allow undefined domain for the cookie library.
      if (domain === 'localhost') domain = undefined

      const formattedDomain: string | undefined =
        typeof domain === 'string' ? domain : undefined

      Cookies.remove(cookieName, {
        domain: formattedDomain,
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      })
      // keep console logs for debugging in dev only
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`Cookie "${cookieName}" removed.`)
      }
    } catch (err) {

      console.error('Error removing cookie:', err)
      throw new Error('Error removing cookie.')
    }
  }

  /**
   * Remove all known session cookies. Throws if any removal fails.
   */
  const deleteCookie = async (): Promise<void> => {
    await eliminarCookie(String(process.env.NEXT_PUBLIC_SESSION_NAME))
    await eliminarCookie(String(process.env.NEXT_LOCAL_SALES_STORE))
    await eliminarCookie('restaurant')
    await eliminarCookie('usuario')
    await eliminarCookie('session')
  }

  /**
   * Logout flow.
   * - supports `redirect` (default true)
   * - supports `refresh` when redirect is false (will delete cookies and reload the page)
   *
   * @param {LogoutParams} params
   */
  const onClickLogout = async (params?: LogoutParams): Promise<void> => {
    const redirect = params?.redirect ?? true
    const refresh = params?.refresh ?? false

    try {
      if (redirect) {
        setLoading(true)
      }

      // If no redirect requested but a refresh was requested, clear cookies and reload.
      if (!redirect && refresh) {
        await deleteCookie()
        globalThis.location.reload()
        return
      }

      // If no redirect and no refresh: just clear cookies and exit.
      if (!redirect && !refresh) {
        await deleteCookie()
        return
      }

      // Proceed with server-side signout and cookie cleanup
      await deleteCookie()

      const port = globalThis.location.port ? `:${globalThis.location.port}` : ''
      const baseUrl = `${globalThis.location.protocol}//${globalThis.location.hostname}${port}`

      const logoutResponse = await fetch(`${baseUrl}/api/auth/signout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!logoutResponse.ok) {
        setLoading(false)
        setAlertBox({ message: 'Error signing out on server' })
        return
      }

      // consume response body (not used, but keep parity with previous behavior)
      try {
        await logoutResponse.json()
      } catch {
        // ignore invalid/no-json responses
      }

      // extra cookie removals (defensive)
      await eliminarCookie(String(process.env.NEXT_PUBLIC_SESSION_NAME))
      Cookies.remove(String(process.env.NEXT_LOCAL_SALES_STORE))
      Cookies.remove('restaurant')
      Cookies.remove('usuario')
      Cookies.remove('session')

      // Clear Apollo Client cache if present
      try {
        // clearStore returns a promise

        client?.clearStore()
      } catch (err) {
        // ignore cache clear errors, but log in dev
        if (process.env.NODE_ENV !== 'production') {

          console.error('Error clearing Apollo cache:', err)
        }
      }

      setLoading(false)
      // Trigger third-party/sign-out helper (e.g., next-auth). We await to catch errors.
      try {
        await signOutAuth({ redirect: true, callbackUrl: '/' })
      } catch (err) {
        setError(true)

        console.error('Error in signOutAuth:', err)
        setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
      }
    } catch (err) {
      setLoading(false)
      setError(true)

      console.error('Logout error:', err)
      setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
    }
  }

  return {
    onClickLogout,
    loading,
    error
  }
}
