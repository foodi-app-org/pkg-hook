/**
 * Reads EXIF orientation from a JPEG file (native, no dependencies)
 * @param {File} file
 * @param validTypes
 * @returns {Promise<number>} Orientation value from 1 to 8
 */
export const getOrientation = (file: File, validTypes: string[]): Promise<number> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const view = new DataView(event.target?.result as ArrayBuffer)

      if (!validTypes.includes(file.type)) {
        return reject(new Error(`Archivo no soportado: ${file.type}`))
      }

      let offset = 2
      const length = view.byteLength

      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return resolve(1)

        const marker = view.getUint16(offset, false)
        offset += 2

        if (marker === 0xFFE1) {
          const little = view.getUint16(offset + 8, false) === 0x4949
          offset += 10

          const tags = view.getUint16(offset, little)
          offset += 2

          for (let i = 0; i < tags; i++) {
            const tagOffset = offset + i * 12
            const tag = view.getUint16(tagOffset, little)
            if (tag === 0x0112) {
              const orientation = view.getUint16(tagOffset + 8, little)
              return resolve(orientation)
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break
        } else {
          offset += view.getUint16(offset, false)
        }
      }

      resolve(1) // por defecto
    }

    reader.onerror = () => {return reject(new Error('Error leyendo archivo'))}
    reader.readAsArrayBuffer(file)
  })
}
