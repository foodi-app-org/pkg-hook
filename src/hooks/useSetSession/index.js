import { Cookies } from '../../cookies'
import { getCurrentDomain } from '../../utils'

export const useSetSession = () => {
  const handleSession = async (props) => {
    try {
      const { cookies } = props
      let domain = getCurrentDomain()

      // Si estás en entorno local, usa 'localhost' como dominio
      if (domain === 'localhost') {
        domain = undefined // Esto permitirá la cookie en 'localhost'
      }

      if (!Array.isArray(cookies)) {
        throw new Error('Input cookies should be an array.')
      }

      for (const { name, value, domain: incomingDomain } of cookies) {
        if (value) {
          const expirationTime = new Date()
          expirationTime.setTime(expirationTime.getTime() + 8 * 60 * 60 * 1000)

          const formattedDomain = incomingDomain || domain

          await Cookies.set(name, value, {
            domain: formattedDomain,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            expires: expirationTime
          })
        }
      }

      console.log('Cookies guardadas correctamente.')
    } catch (error) {
      console.error('Error al guardar las cookies:', error)
      throw new Error('Error al guardar las cookies.')
    }
  }

  return [handleSession]
}
