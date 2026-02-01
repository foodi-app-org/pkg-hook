import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'

export const useGetStoreCookie = () => {
  const [vpStoreCookie, setVpStoreCookie] = useState<string | null>(null)

  useEffect(() => {
    const getCookieValue = () => {
      const cookieValue = Cookies.get(String(process.env.NEXT_PUBLIC_SESSION_NAME))
      if (cookieValue) {
        setVpStoreCookie(cookieValue)
      }
    }

    getCookieValue()
  }, []) // Empty dependency array, so this effect runs once

  return vpStoreCookie
}
