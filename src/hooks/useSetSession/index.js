import { Cookies } from '../../cookies';
import { getCurrentDomain } from '../../utils';

export const useSetSession = () => {
  const domain = getCurrentDomain()

  const handleSession = async (props) => {
    try {
      const { cookie } = props;
      if (!Array.isArray(cookie)) {
        throw new Error('Input cookies should be an array.');
      }

      for (const { name, value } of cookie) {
        if (value) {
          const expirationTime = new Date();
          expirationTime.setTime(expirationTime.getTime() + 8 * 60 * 60 * 1000)
          await Cookies.set(name, value, {
            domain,
            path: '/',
            secure:  process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Configura 'none' en producción
            expires: expirationTime
          });
        }
      }

      console.log('Cookies guardadas correctamente.');
    } catch (error) {
      console.error('Error al guardar las cookies:', error);
      throw new Error('Error al guardar las cookies.');
    }
  };

  return [handleSession];
};
