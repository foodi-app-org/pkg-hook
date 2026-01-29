export class UtilDateRange {
  private readonly date: Date

  constructor (date: Date | string | number = new Date()) {
    this.date = new Date(date) // Asegura que sea un objeto Date
  }

  private toLocalTime (date: Date | string | number): Date {
    const offset = -5 // UTC-5 (ajustar si es necesario)
    const localDate = new Date(date)
    localDate.setHours(localDate.getHours() + offset)
    return localDate
  }

  getStartOfDay (): Date {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(0, 0, 0, 0)
    return localDate
  }

  getEndOfDay (): Date {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(23, 59, 59, 999)
    return localDate
  }

  getRange (): { start: Date; end: Date } {
    return {
      start: this.getStartOfDay(),
      end: this.getEndOfDay()
    }
  }
}
