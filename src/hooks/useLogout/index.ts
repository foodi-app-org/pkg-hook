import { useApolloClient } from '@apollo/client'
import { useState } from 'react'
import { Cookies } from '../../cookies/index'
import { getCurrentDomain } from '../../utils'
import { signOutAuth } from './helpers'

interface UseLogoutOptions {
  setAlertBox?: (options: { message: string }) => { message: string }
}
export const useLogout = ({
  setAlertBox = ({
    message
  }) => { return { message } }
}: UseLogoutOptions = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const client = useApolloClient()

  const eliminarCookie = async (nombreCookie: string) => {
    try {
      let domain = getCurrentDomain()

      // Si estás en entorno local, usa 'localhost' como dominio
      if (domain === 'localhost') {
        domain = false // Esto permitirá la cookie en 'localhost'
      }

      const expirationTime = new Date()
      expirationTime.setTime(expirationTime.getTime() - 1000) // Establece una fecha de expiración en el pasado

      const formattedDomain = domain || getCurrentDomain()

      await Cookies.remove(nombreCookie, { domain: formattedDomain, path: '/', secure: process.env.NODE_ENV === 'production' })

      console.log('Cookie eliminada correctamente.')
    } catch (error) {
      console.error('Error al eliminar la cookie:', error)
      throw new Error('Error al eliminar la cookie. ')
    }
  }
  const deleteCookie = async () => {
    await eliminarCookie(String(process.env.NEXT_PUBLIC_SESSION_NAME))
    await eliminarCookie(String(process.env.LOCAL_SALES_STORE))
    await eliminarCookie('restaurant')
    await eliminarCookie('usuario')
    await eliminarCookie('session')
  }
  const onClickLogout = async (params?: { redirect?: boolean }) => {
    const redirect = params?.redirect !== undefined ? params.redirect : true
    console.log(redirect)
    try {
      if (!redirect) return await deleteCookie()
      setLoading(true)
      await deleteCookie()
      // Logout from the server
      const port = window.location.port ? `:${window.location.port}` : ''
      const baseUrl = `${window.location.protocol}//${window.location.hostname}${port}`
      const logoutResponse = await fetch(`${baseUrl}/api/auth/signout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!logoutResponse.ok) {
        setLoading(false)
        return
      }

      await logoutResponse.json()
      console.log('Intentando borrar cookies...')

      // Eliminar la cookie process.env.NEXT_PUBLIC_SESSION_NAME
      await eliminarCookie(String(process.env.NEXT_PUBLIC_SESSION_NAME))
      Cookies.remove(process.env.LOCAL_SALES_STORE)
      Cookies.remove('restaurant')
      Cookies.remove('usuario')
      Cookies.remove('session')

      // Clear Apollo Client cache
      client?.clearStore()

      setLoading(false)
      console.log('Cookies eliminadas y sesión cerrada con éxito')
      signOutAuth({ redirect: true, callbackUrl: '/' })
        .catch(() => {
          setError(true)
          setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
        })
    } catch (error) {
      setLoading(false)
      setError(true)
      setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
    }
  }

  return [onClickLogout, { loading, error }]
}
