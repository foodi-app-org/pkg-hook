/**
 * Reads image orientation metadata from a JPEG file (native, no dependencies)
 * @param {File} file
 * @param validTypes
 * @returns {Promise<number>} Orientation value from 1 to 8
 */
/**
 * Reads image orientation metadata from a JPEG file (native, no dependencies)
 * @param {File} file
 * @param validTypes
 * @param view
 * @param offset
 * @param length
 * @returns {Promise<number>} Orientation value from 1 to 8
 */
function findOrientation(view: DataView, offset: number, length: number): number {
  while (offset < length) {
    if (view.getUint16(offset + 2, false) <= 8) return 1;

    const marker = view.getUint16(offset, false);
    offset += 2;

    if (marker === 0xFFE1) {
      return readExifOrientation(view, offset);
    } else if ((marker & 0xFF00) === 0xFF00) {
      offset += view.getUint16(offset, false);
    } else {
      break;
    }
  }
  return 1; // por defecto
}

/**
 *
 * @param view
 * @param offset
 * @returns {number} Orientation value from 1 to 8
 */
function readExifOrientation(view: DataView, offset: number): number {
  const little = view.getUint16(offset + 8, false) === 0x4949;
  offset += 10;

  const tags = view.getUint16(offset, little);
  offset += 2;

  for (let i = 0; i < tags; i++) {
    const tagOffset = offset + i * 12;
    const tag = view.getUint16(tagOffset, little);
    if (tag === 0x0112) {
      const orientation = view.getUint16(tagOffset + 8, little);
      return orientation;
    }
  }
  return 1;
}

export const getOrientation = async (file: File, validTypes: string[]): Promise<number> => {
  if (!validTypes.includes(file.type)) {
    throw new Error(`Archivo no soportado: ${file.type}`);
  }

  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    const offset = 2;
    const length = view.byteLength;

    return findOrientation(view, offset, length);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Error leyendo archivo: ${err.message}`);
    }
    throw new Error('Error leyendo archivo');
  }
}
