/**
 * Formats a phone number as (XXX) XXX-XXXX.
 * @param phoneNumber
 * @returns string
 */
export const formatPhoneNumber = (phoneNumber: string | number): string => {
  const cleaned = String(phoneNumber).replaceAll(/\D/g, '')
  const match = /^(\d{3})(\d{3})(\d{4})$/.exec(cleaned)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return String(phoneNumber)
}

/**
 * Validates if the phone number matches the format (XXX) XXX-XXXX.
 * @param phoneNumber
 * @returns string number phone
 */
export const validatePhoneNumber = (phoneNumber: string | number): boolean => {
  const regex = /^\(\d{3}\) \d{3}-\d{4}$/
  return regex.test(String(phoneNumber))
}
