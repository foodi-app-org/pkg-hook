/**
 * Minimal shape of an optional Electron bridge the renderer may expose on
 * `window` for saving files through the main process. Entirely optional: when
 * absent, the browser download path is used.
 */
interface ElectronDownloadBridge {
  saveReportFile?: (payload: { fileName: string; data: ArrayBuffer; mimeType: string }) => Promise<boolean>
}

const getElectronBridge = (): ElectronDownloadBridge | null => {
  if (typeof globalThis === 'undefined') return null
  const w = globalThis as unknown as { electronAPI?: ElectronDownloadBridge; api?: ElectronDownloadBridge }
  return w.electronAPI ?? w.api ?? null
}

/**
 * Downloads a generated report file to the user's machine.
 *
 * Resolution order:
 * 1. If a safe Electron bridge (`window.electronAPI.saveReportFile` or
 *    `window.api.saveReportFile`) is present, delegate to the main process so
 *    the file is saved natively (no `nodeIntegration` needed in the renderer).
 * 2. Otherwise use the standard browser blob download, honoring the file name
 *    and extension. Browser security restrictions are respected (no silent
 *    writes to arbitrary paths).
 *
 * @param fileUrl - URL to fetch the file from (the frontend `/api/files` proxy).
 * @param fileName - Target file name (preserves extension).
 * @param mimeType - MIME type for the blob.
 * @returns `true` on success.
 * @throws When the fetch fails.
 */
export const downloadReportFile = async (
  fileUrl: string,
  fileName: string,
  mimeType = 'application/octet-stream'
): Promise<boolean> => {
  const response = await fetch(fileUrl, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`No se pudo descargar el archivo (${response.status}).`)
  }

  const bridge = getElectronBridge()
  if (bridge?.saveReportFile) {
    const buffer = await response.arrayBuffer()
    const ok = await bridge.saveReportFile({ fileName, data: buffer, mimeType })
    if (ok) return true
    // Fall through to browser download if the bridge declined.
  }

  const blob = await response.blob()
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  link.remove()
  globalThis.URL.revokeObjectURL(url)
  return true
}
