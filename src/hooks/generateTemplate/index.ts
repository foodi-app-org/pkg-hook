import * as Excel from 'xlsx'
import { saveAs } from 'file-saver'

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
  GenExcelReport (data, type) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array of objects.')
    }

    if (typeof type !== 'number') {
      throw new Error('Type must be a valid number.')
    }

    const ws = Excel.utils.json_to_sheet(data)

    // Apply bold font to the header row
    const range = Excel.utils.decode_range(ws['!ref'])
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
    if (fileName != null) {
      saveAs(blob, String(fileName))
    } else {
      throw new Error('Invalid report type provided.')
    }
  }

  /**
   * Generates the file name for the Excel report based on the type.
   * @param {number} type - The type of report.
   * @returns {string | null} The file name for the report, or null if type is invalid.
   */
  GenExcelReportFileName (type) {
    const fileNames = {
      1: `report_${new Date().toISOString().replace(/[:.]/g, '-')}.xlsx`
    }

    return fileNames[type] ? fileNames[type] : null
  }
}
