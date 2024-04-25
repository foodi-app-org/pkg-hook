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
        console.log({ cookieValue })
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

  return { getCookies }
}
