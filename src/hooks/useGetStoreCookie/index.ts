import Cookies from 'js-cookie'
import { useState, useEffect } from 'react'

export const useGetStoreCookie = () => {
  const [vpStoreCookie, setVpStoreCookie] = useState(null)

  useEffect(() => {
    const getCookieValue = () => {
      const cookieValue = Cookies.get(process.env.NEXT_PUBLIC_SESSION_NAME)
      console.log('Cookie Value:', cookieValue)

      if (cookieValue) {
        setVpStoreCookie(cookieValue)
      }
    }

    getCookieValue()
  }, []) // Empty dependency array, so this effect runs once

  return vpStoreCookie
}
