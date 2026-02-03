import crypto from 'crypto'

/**
 *
 * @param password
 * @param salt
 * @returns {string}
 */
function generateEncryptionKey(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    .toString('hex')
    .slice(0, 32)
}

const ENCRYPTION_KEY = generateEncryptionKey(
  'tu-contraseña',
  'alguna-sal-segura'
)
const IV_LENGTH = 12 // Para AES-GCM, el IV recomendado es 12 bytes

export const encryptSession = (text: string): string | null => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY),
      iv
    )
    let encrypted = cipher.update(text, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    const authTag = cipher.getAuthTag()
    // Concatenar IV, AuthTag y el texto cifrado, separados por ':'
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex')
    ].join(':')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error de cifrado:', error.message)
    }
    return null
  }
}

export const decryptSession = (text: string): string | null => {
  try {
    if (!text) return null
    const textParts = text.split(':')
    if (textParts.length !== 3) return null
    const iv = Buffer.from(textParts[0], 'hex')
    const authTag = Buffer.from(textParts[1], 'hex')
    const encryptedText = Buffer.from(textParts[2], 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY),
      iv
    )
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error de descifrado:', error.message)
    }
    return null
  }
}
