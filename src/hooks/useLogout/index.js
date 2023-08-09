import { useApolloClient } from '@apollo/client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Cookies } from '../../cookies'
import { fetchJson } from '../../hooks/useFetchJson'

export const useLogout = ({ setAlertBox = () => {  } } = {}) =>  {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const router = useRouter()
  const client = useApolloClient()

  const onClickLogout = async () => {
    setLoading(true)
    await fetchJson(`${process.env.URL_BASE}api/auth/logout`, {
    }).then(res => {
      localStorage.removeItem('session')
      localStorage.removeItem('usuario')
      localStorage.removeItem('location')
      localStorage.removeItem('sessionGoogle')
      localStorage.removeItem('longitude')
      localStorage.removeItem('latitude')
      localStorage.removeItem('restaurant')
      Cookies.remove(process.env.SESSION_NAME)
      Cookies.remove(process.env.LOCAL_SALES_STORE)
      Cookies.remove('restaurant')
      client?.clearStore()
      router.replace('/entrar')
      setLoading(false)
    }).catch(() => {
        setError(true)
        setAlertBox({ message: 'Ocurrió un error al cerrar session' })
      })
    setLoading(false)
  }

  return [onClickLogout, { loading, error }]
}