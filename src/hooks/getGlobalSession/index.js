import crypto from 'crypto'

function generateEncryptionKey(password, salt) {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 32, 'sha256')
    .toString('hex')
    .slice(0, 32)
}

const ENCRYPTION_KEY = generateEncryptionKey(
  'tu-contraseña',
  'alguna-sal-segura'
)
const IV_LENGTH = 16 // Para AES, este siempre debe ser 16

export const encryptSession = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv
    )
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  } catch (error) {
    return null
  }
}

export const decryptSession = (text) => {
  try {
    if (!text) return
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv
    )
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
  } catch (error) {
    return null
  }
}