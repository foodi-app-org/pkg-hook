const data = [
  { x: '2021-10-17T14:38:45.540Z', y: 2 }
]
export const getDateParts = (isString: string) => {
  const [year, month, day, hr, min, sec] = isString.split(/\D/g)
  return { year, month, day, hr, min, sec }
}
export function groupDates(arr: Array<{ x: string; y: number }>) {
  const total = arr.reduce((a: number, b: { x: string; y: number }) => {
    const { hr } = getDateParts(b.x)
    return a + Number.parseInt(hr || '0', 10)
  }, 0)
  return total
}
