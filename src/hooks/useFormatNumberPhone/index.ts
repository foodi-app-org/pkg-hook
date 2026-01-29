/**
 * Description
 * @param {any} phoneNumber type number or string
 * @returns {any}
 */
export const formatPhoneNumber = (phoneNumber) => {
  const cleaned = ('' + phoneNumber).replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phoneNumber
}

/**
 * Description
 * @param {any} phoneNumber type number or string
 * @returns {any}
 */
export const validatePhoneNumber = (phoneNumber) => {
  const regex = /^\(\d{3}\) \d{3}-\d{4}$/
  return regex.test(phoneNumber)
}
