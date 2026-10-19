import * as XLSX from 'xlsx'

export interface InvalidPhoneRow {
  rowNumber: number
  value: string
  reason: string
}

export interface CampaignExcelPreview {
  numbers: string[]
  totalNonEmptyRows: number
  duplicateCount: number
  invalidRows: InvalidPhoneRow[]
}

const PHONE_HEADERS = new Set([
  'telefono',
  'numerodetelefono',
  'numero',
  'celular',
  'phone',
  'phonenumber',
  'whatsapp',
  'whatsappnumber',
])

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '')
  }
  return String(value).trim()
}

function normalizePhone(value: unknown): string {
  const raw = cellToString(value)
  // Permite valores como +57 300-123-4567 o (300) 123 4567.
  return raw.replace(/\D/g, '')
}

function isPhoneHeader(value: unknown): boolean {
  const header = normalizeHeader(value)
  return PHONE_HEADERS.has(header) || header.includes('numerodetelefono')
}

export async function parseCampaignExcel(file: File): Promise<CampaignExcelPreview> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['xlsx', 'xls'].includes(extension)) {
    throw new Error('Selecciona un archivo Excel .xlsx o .xls.')
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error('El archivo Excel no contiene hojas.')

  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  })

  const headerIndex = rows.findIndex(row => row.some(cell => cellToString(cell) !== ''))
  if (headerIndex < 0) throw new Error('La primera hoja está vacía.')

  const headerRow = rows[headerIndex]
  const phoneColumnIndex = headerRow.findIndex(isPhoneHeader)
  if (phoneColumnIndex < 0) {
    throw new Error('No se encontró una columna de teléfonos. Usa el encabezado "telefono" de la plantilla.')
  }

  const numbers: string[] = []
  const seen = new Set<string>()
  const invalidRows: InvalidPhoneRow[] = []
  let totalNonEmptyRows = 0
  let duplicateCount = 0

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index]
    const rawValue = row?.[phoneColumnIndex]
    const raw = cellToString(rawValue)
    if (!row?.some(cell => cellToString(cell) !== '')) continue

    totalNonEmptyRows += 1
    const phone = normalizePhone(rawValue)

    if (!phone) {
      invalidRows.push({ rowNumber: index + 1, value: raw || '(vacío)', reason: 'El teléfono está vacío.' })
      continue
    }

    if (phone.length < 10 || phone.length > 15) {
      invalidRows.push({
        rowNumber: index + 1,
        value: raw,
        reason: 'Debe tener entre 10 y 15 dígitos e incluir el indicativo del país.',
      })
      continue
    }

    if (seen.has(phone)) {
      duplicateCount += 1
      continue
    }

    seen.add(phone)
    numbers.push(phone)
  }

  return { numbers, totalNonEmptyRows, duplicateCount, invalidRows }
}

export function createCleanCampaignFile(numbers: string[]): File {
  const workbook = XLSX.utils.book_new()
  const contactsSheet = XLSX.utils.aoa_to_sheet([
    ['telefono'],
    ...numbers.map(number => [number]),
  ])
  contactsSheet['!cols'] = [{ wch: 24 }]
  // Fuerza los teléfonos como texto para conservar todos los dígitos en Excel.
  for (let rowIndex = 1; rowIndex <= numbers.length; rowIndex += 1) {
    const cell = contactsSheet[`A${rowIndex + 1}`]
    if (cell) cell.z = '@'
  }
  XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contactos')

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['Instrucciones'],
    ['Una fila por destinatario.'],
    ['Incluye el indicativo internacional, por ejemplo 573001234567.'],
    ['No incluyas espacios ni símbolos en la columna telefono.'],
  ])
  instructionsSheet['!cols'] = [{ wch: 78 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')

  const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new File([output], 'destinatarios-whatsapp.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function downloadWhatsAppTemplate(): void {
  const workbook = XLSX.utils.book_new()
  const contactsSheet = XLSX.utils.aoa_to_sheet([['telefono']])
  contactsSheet['!cols'] = [{ wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contactos')

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['Instrucciones para la campaña de WhatsApp'],
    ['Escribe un número por fila debajo del encabezado telefono.'],
    ['Incluye el indicativo internacional. Ejemplo de formato: 573001234567.'],
    ['No uses espacios, guiones ni fórmulas. La columna telefono debe contener texto o dígitos.'],
    ['No agregues encabezados antes de la fila telefono.'],
  ])
  instructionsSheet['!cols'] = [{ wch: 92 }]
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones')

  XLSX.writeFile(workbook, 'plantilla-campana-whatsapp.xlsx')
}
