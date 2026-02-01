/**
 * Parses a formatted number (string or number) and converts it into a float with two decimal places.
 * @param {string|number} value - The number to parse (e.g., "1.500,00", "1500.00", 1500).
 * @returns {string} Parsed number as a string in the format "1500.00".
 * @throws Will throw an error if the input is not a valid formatted number.
 */
export const parseNumber = (value: string | number) => {
  // Convert value to string if it's a number
  const stringValue = typeof value === 'number' ? value.toString() : value

  if (typeof stringValue !== 'string') {
    throw new TypeError('Input must be a string or number')
  }

  // Remove thousands separators and adjust decimal separator
  const sanitizedValue = stringValue
    .replaceAll('.', '') // Removes thousands separators (.)
    .replace(',', '.') // Changes comma to period for decimal

  // Parse the sanitized value as a float
  const parsedNumber = Number.parseFloat(sanitizedValue)
  if (Number.isNaN(parsedNumber)) {
    throw new TypeError('Invalid number format')
  }

  // Format the number with two decimal places
  return parsedNumber.toFixed(2)
}

// Example usage:
// console.log(parseNumber('1.500,00')) // "1500.00"
// console.log(parseNumber('1500.00')) // "1500.00"
// console.log(parseNumber('1,500.50')) // "1500.50"
// console.log(parseNumber('500')) // "500.00"
// console.log(parseNumber('0,50')) // "0.50"
// console.log(parseNumber(1500)) // "1500.00"
// console.log(parseNumber(1500.5)) // "1500.50"
