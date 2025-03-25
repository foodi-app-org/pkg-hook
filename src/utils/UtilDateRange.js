export class UtilDateRange {
  constructor (date = new Date()) {
    this.date = new Date(date) // Asegura que sea un objeto Date
  }

  toLocalTime (date) {
    const offset = -5 // UTC-5 (ajustar si es necesario)
    const localDate = new Date(date)
    localDate.setHours(localDate.getHours() + offset)
    return localDate
  }

  getStartOfDay () {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(0, 0, 0, 0)
    return localDate
  }

  getEndOfDay () {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(23, 59, 59, 999)
    return localDate
  }

  getRange () {
    return {
      start: this.getStartOfDay(),
      end: this.getEndOfDay()
    }
  }
}
