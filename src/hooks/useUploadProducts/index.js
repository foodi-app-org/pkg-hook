import { useState } from 'react'
import * as XLSX from 'xlsx'

export const useUploadProducts = () => {
  const [data, setData] = useState([])

  const [active, setActive] = useState(0)
  const [overActive, setOverActive] = useState(0)

  const handleOverActive = (index) => {
    setOverActive(index)
  }
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        resolve(json)
      }
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const onChangeFiles = async (files) => {
    const filePromises = Array.from(files).map(file => readExcelFile(file))
    const data = await Promise.all(filePromises)
    setData(data.flat())
  }

  return {
    active,
    data,
    overActive,
    handleOverActive,
    onChangeFiles,
    setActive
  }
}
