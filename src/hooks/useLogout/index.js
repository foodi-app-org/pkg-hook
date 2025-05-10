import { useApolloClient } from '@apollo/client'
import { useState } from 'react'
import { Cookies } from '../../cookies/index'
import { signOutAuth } from './helpers'
import { getCurrentDomain } from '../../utils'
export { signOutAuth } from './helpers'

export const useLogout = ({
  setAlertBox = ({
    message
  }) => { return { message } }
} = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const client = useApolloClient()

  const eliminarCookie = async (nombreCookie) => {
    try {
      let domain = getCurrentDomain()

      // Si estás en entorno local, usa 'localhost' como dominio
      if (domain === 'localhost') {
        domain = undefined // Esto permitirá la cookie en 'localhost'
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
    await eliminarCookie(process.env.SESSION_NAME)
    await eliminarCookie(process.env.LOCAL_SALES_STORE)
    await eliminarCookie('restaurant')
    await eliminarCookie('usuario')
    await eliminarCookie('session')
  }
  const onClickLogout = async ({ redirect = true } = { redirect: true }) => {
    console.log(redirect)
    try {
      if (!redirect) return await deleteCookie()
      setLoading(true)
      await deleteCookie()
      // Logout from the server
      const logoutResponse = await fetch(`${process.env.NEXT_PUBLIC_URL_BASE}/api/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      console.log('Logout response:', logoutResponse)
      if (!logoutResponse.ok) {
        setLoading(false)
        return
      }

      await logoutResponse.json()
      console.log('Intentando borrar cookies...')

      // Eliminar la cookie process.env.SESSION_NAME
      await eliminarCookie(process.env.SESSION_NAME)
      Cookies.remove(process.env.LOCAL_SALES_STORE)
      Cookies.remove('restaurant')
      Cookies.remove('usuario')
      Cookies.remove('session')

      // Clear Apollo Client cache
      client?.clearStore()

      setLoading(false)
      console.log('Cookies eliminadas y sesión cerrada con éxito')
      signOutAuth({ redirect: true, callbackUrl: '/', reload: false })
        .catch(() => {
          console.error('Error al cerrar sesión en el cliente')
          setError(true)
          setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
        })
      window.location.href = '/'
    } catch (error) {
      setLoading(false)
      setError(true)
      setAlertBox({ message: 'Ocurrió un error al cerrar sesión' })
    }
  }

  return [onClickLogout, { loading, error }]
}
