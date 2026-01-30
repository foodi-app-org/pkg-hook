import { saveAs } from 'file-saver'
import * as Excel from 'xlsx'

/**
 * Class to generate Excel reports.
 */
export class GenerateReport {
  /**
   * Generates an Excel report from given data and type.
   * @param {Array<object>} data - The data to be included in the Excel report.
   * @param {number} type - The type of report to generate.
   * @throws Will throw an error if data is not an array or type is not a valid number.
   */
  GenExcelReport(data: object[], type: number): void {
    if (!Array.isArray(data)) {
      throw new TypeError('Data must be an array of objects.')
    }

    if (typeof type !== 'number') {
      throw new TypeError('Type must be a valid number.')
    }

    const ws = Excel.utils.json_to_sheet(data)

    // Apply bold font to the header row
    const ref = ws['!ref']
    if (!ref) {
      throw new TypeError('Worksheet reference is undefined.')
    }
    const range = Excel.utils.decode_range(ref)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[Excel.utils.encode_cell({ r: 0, c: C })]
      if (cell) {
        cell.s = {
          font: {
            bold: true
          }
        }
      }
    }

    const wb = Excel.utils.book_new()
    Excel.utils.book_append_sheet(wb, ws, 'Hoja1')
    const excelBuffer = Excel.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fileName = this.GenExcelReportFileName(type)
    if (fileName) {
      saveAs(blob, String(fileName))
    } else {
      throw new TypeError('Invalid report type provided.')
    }
  }

  /**
   * Generates the file name for the Excel report based on the type.
   * @param {number} type - The type of report.
   * @returns {string | null} The file name for the report, or null if type is invalid.
   */
  GenExcelReportFileName(type: number): string | null {
    const fileNames: { [key: number]: string } = {
      1: `report_${new Date().toISOString().replace(':', '-').replace('.', '-')}.xlsx`
    }

    return fileNames[type] ?? null
  }
}
