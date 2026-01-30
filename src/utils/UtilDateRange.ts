/**
 * Returns an object containing the start and end of the day in local time (UTC-5 by default) for the given date.
 * @returns {{ start: Date; end: Date }} An object with `start` and `end` Date properties.
 */
export class UtilDateRange {
  private readonly date: Date

  /**
   * 
   * @param date
   * @returns UtilDateRange instance
   */
  constructor(date: Date | string | number = new Date()) {
    this.date = new Date(date) // Asegura que sea un objeto Date
  }

  /**
   *
   * @param date
   * @returns Date ajustada a la zona horaria local (UTC-5)
   */
  private toLocalTime(date: Date | string | number): Date {
    const offset = -5 // UTC-5 (ajustar si es necesario)
    const localDate = new Date(date)
    localDate.setHours(localDate.getHours() + offset)
    return localDate
  }

  /**
   * @returns Date al inicio del día (00:00:00.000) en hora local
   */
  getStartOfDay(): Date {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(0, 0, 0, 0)
    return localDate
  }

  /**
   * @returns Date al final del día (23:59:59.999) en hora local
   */
  getEndOfDay(): Date {
    const localDate = this.toLocalTime(this.date)
    localDate.setHours(23, 59, 59, 999)
    return localDate
  }

  /**
   * @returns {{ start: Date; end: Date }} Objeto con las fechas de inicio y fin del día en hora local
   */
  getRange(): { start: Date; end: Date } {
    return {
      start: this.getStartOfDay(),
      end: this.getEndOfDay()
    }
  }
}
