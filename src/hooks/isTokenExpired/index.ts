/**
 * Verifica si un token JWT ha expirado.
 * @param {string} token El token JWT a verificar.
 * @param {string} [expField='exp'] El nombre del campo que contiene la fecha de expiración en el token.
 * @returns {boolean} True si el token ha expirado, false de lo contrario.
 */
export const isTokenExpired = (token: string, expField = 'exp'): boolean => {
  try {
    const [, payloadBase64] = token.split('.')
    const decodedJson = Buffer.from(payloadBase64, 'base64').toString()
    const decoded = JSON.parse(decodedJson)
    const exp = decoded[expField] * 1000 // Convertir segundos a milisegundos
    return Date.now() >= exp
  } catch (error) {
    if (error instanceof SyntaxError) {
      return true
    }
    return true
  }
}
