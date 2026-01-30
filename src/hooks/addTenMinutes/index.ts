/**
 * Function that adds 10 to a given number representing minutes.
 * @param {number} num - The number of minutes (between 1 and 60).
 * @returns {string} A string indicating the original number and the result of adding 10 minutes.
 */
export const addTenMinutes = (num: number) => {
  if (num > 60) return ''
  if (num >= 50) {
    const newNum = num - 10
    return `${newNum} - ${60} min`
  } 
  return `${num} - ${num + 10} min`
  
}
