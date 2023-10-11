import { useApolloClient } from '@apollo/client'
import { useState } from 'react'
import { Cookies } from '../../cookies'
import { signOutAuth } from './helpers'
export { signOutAuth } from './helpers'

export const useLogout = ({ setAlertBox = () => { } } = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const client = useApolloClient()

  const onClickLogout = async () => {
    try {
      setLoading(true)
      // Logout from the server
      const logoutResponse = await window.fetch(`${process.env.URL_BASE}/api/auth/logout/`, {})
      if (!logoutResponse.ok) return
      await window
        .fetch(`${process.env.URL_BASE}/api/auth/logout/`, {})
        .then(res => {
          if (res) {
            Cookies.remove(process.env.SESSION_NAME)
            Cookies.remove(process.env.LOCAL_SALES_STORE)
            Cookies.remove('restaurant')
            Cookies.remove('usuario')
            Cookies.remove('session')
            client?.clearStore()
            setLoading(false)
            console.log('Borrado todo')
          }
        })
      signOutAuth({ redirect: true, callbackUrl: '/' })
        .catch(() => {
          setError(true)
          setAlertBox({ message: 'Ocurrió un error al cerrar session' })
        })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setError(true)
      setAlertBox({ message: 'Ocurrió un error al cerrar session' })
    }
  }

  return [onClickLogout, { loading, error }]
}
