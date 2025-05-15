/**
 * @module dateUtils
 */

/**
 * @param {Date|string|number} input
 *   A Date object, an ISO‑string, or a millisecond timestamp.
 * @returns {Date}
 */
function toDate (input) {
  return input instanceof Date ? input : new Date(input)
}

export class UtilDateRange {
  /**
   * @param {Date|string|number} [date=new Date()]
   *   Reference date for the local day.
   * @param {number} [offset=-5]
   *   Timezone offset in hours (e.g., -5 for UTC−5).
   */
  constructor (date = new Date(), offset = -5) {
    this.localDate = toDate(date)
    this.offset = offset
  }

  /**
   * Build a UTC Date at the start (00:00:00.000) or end (23:59:59.999)
   * of the *local* day.
   * @param {boolean} isEnd
   * @returns {Date}
   */
  getDayEdge (isEnd = false) {
    // Clone the reference date
    const d = new Date(this.localDate)
    // Compute UTC hours that correspond to local midnight or local 23:59:59.999
    const baseHour = isEnd ? 23 : 0
    const minute = isEnd ? 59 : 0
    const second = isEnd ? 59 : 0
    const ms = isEnd ? 999 : 0

    // Because date.setUTCHours sets the UTC‑time fields,
    // we subtract the offset to shift local→UTC.
    d.setUTCHours(baseHour - this.offset, minute, second, ms)
    return d
  }

  /** @returns {Date} UTC Date at local‑day start. */
  getStartOfDay () {
    return this.getDayEdge(false)
  }

  /** @returns {Date} UTC Date at local‑day end. */
  getEndOfDay () {
    return this.getDayEdge(true)
  }

  /**
   * Get formatted string range:
   * "YYYY-MM-DD HH:mm:ss.SSS +00:00"
   * @returns {{start: string, end: string}}
   */
  getRange ({ fromDate, toDate } = {}) {
    const offset = this.offset
    const startUtc = new UtilDateRange(fromDate, offset).getStartOfDay()
    const endUtc = new UtilDateRange(toDate, offset).getEndOfDay()
    if (fromDate && toDate) {
      return {
        start: this.formatUTC(startUtc),
        end: this.formatUTC(endUtc)
      }
    }
    return {
      start: this.formatUTC(this.getStartOfDay()),
      end: this.formatUTC(this.getEndOfDay())
    }
  }

  /**
   * @param {Date} date
   * @returns {string}
   */
  formatUTC (date) {
    const pad = (n, digits = 2) => String(n).padStart(digits, '0')
    return (
      `${date.getUTCFullYear()}-` +
      `${pad(date.getUTCMonth() + 1)}-` +
      `${pad(date.getUTCDate())} ` +
      `${pad(date.getUTCHours())}:` +
      `${pad(date.getUTCMinutes())}:` +
      `${pad(date.getUTCSeconds())}.` +
      `${pad(date.getUTCMilliseconds(), 3)} +00:00`
    )
  }
}
