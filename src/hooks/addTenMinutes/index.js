/**
 * Function that adds 10 to a given number representing minutes.
 * @param {number} num - The number of minutes (between 1 and 60).
 * @returns {string} A string indicating the original number and the result of adding 10 minutes.
 */
export const addTenMinutes = (num) => {
  if (num >= 50) {
    return `${num} - ${60} min`
  } else {
    return `${num} - ${num + 10} min`
  }
}
