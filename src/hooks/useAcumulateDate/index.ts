const data = [
  { x: '2021-10-17T14:38:45.540Z', y: 2 }
]
export const getDateParts = (isString) => {
  const [year, month, day, hr, min, sec] = isString.split(/\D/g)
  return { year, month, day, hr, min, sec }
}
export function groupDates (arr) {
  const total = arr.reduce((a, b) => {
    const { hr } = getDateParts(b.x)
    return a + parseInt(hr)
  }, 0)
  return total
}
// eslint-disable-next-line no-unused-vars
const result = groupDates(data)
