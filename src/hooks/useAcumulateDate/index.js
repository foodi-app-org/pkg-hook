
const data = [
    { x: '2021-10-17T14:38:45.540Z', y: 2 }
  ]
  export const get_date_parts = (iso_string) =>  {
    const [year, month, day, hr, min, sec] = iso_string.split(/\D/g)
    return { year, month, day, hr, min, sec }
  }
  function group_by_year(arr) {
    let total = arr.reduce((a, b) => {
      const { day } = get_date_parts(b.x)
      return a + parseInt(day)
    }, 0)
    return total
  }
  const result = group_by_year(data)