import Cookies from 'js-cookie'

export const useGetCookies = () => {
  const getCookies = (cookieNames) => {
    try {
      if (!Array.isArray(cookieNames)) {
        throw new Error('Input cookie names should be an array.')
      }

      const cookiesData = []

      for (const cookieName of cookieNames) {
        const cookieValue = Cookies.get(cookieName)
        if (cookieValue) {
          cookiesData.push({ name: cookieName, value: cookieValue })
        }
      }
      return cookiesData
    } catch (error) {
      console.error('Error al traer las cookies:', error)
      return []
    }
  }

  const getCookie = (cookieName) => {
    try {
      if (typeof cookieName !== 'string') {
        throw new Error('Input cookie name should be a string.')
      }

      const cookieValue = Cookies.get(cookieName)
      if (cookieValue) {
        return { name: cookieName, value: cookieValue }
      }
      return null
    } catch (error) {
      console.error('Error al traer la cookie:', error)
      return null
    }
  }

  return { getCookies, getCookie }
}
