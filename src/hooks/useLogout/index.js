import { useApolloClient } from '@apollo/client'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Cookies } from '../../cookies'

export const useLogout = ({ setAlertBox = () => { } } = {}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const router = useRouter()
  const client = useApolloClient()

  const onClickLogout = async () => {
    setLoading(true)
    await window
      .fetch(`${process.env.URL_BASE}api/auth/logout/`, {})
      .then(res => {
        if (res) {
          localStorage.removeItem('session')
          localStorage.removeItem('usuario')
          localStorage.removeItem('location')
          localStorage.removeItem('sessionGoogle')
          localStorage.removeItem('namefood')
          localStorage.removeItem('longitude')
          localStorage.removeItem('latitude')
          localStorage.removeItem('userlogin')
          localStorage.removeItem('restaurant')
          Cookies.remove('vp.store')
          Cookies.remove('app.cart.sales')
          Cookies.remove('restaurant')
          client?.clearStore()
          router.replace('/entrar')
          setLoading(false)
        }
      })
      .catch(() => {
        setError(true)
        setAlertBox({ message: 'Ocurrió un error al cerrar session' })
      })
    setLoading(false)
  }

  return [onClickLogout, { loading, error }]
}
