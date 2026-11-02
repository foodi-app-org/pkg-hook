/**
 * Shape of the generic Electron IPC bridge the POS preload actually exposes
 * (`window.electron.ipcRenderer`). We only rely on `invoke`, and only when a
 * matching main-process handler is registered; otherwise we fall back to the
 * standard Chromium download (which works inside Electron too).
 */
interface ElectronIpcBridge {
  ipcRenderer?: {
    invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>
  }
}

/**
 * IPC channel a host app may implement in the Electron main process to save a
 * report file natively. Optional: when no handler is registered, the renderer
 * download path is used. (Main process handler not shipped by default.)
 */
const REPORT_SAVE_CHANNEL = 'report:save-file'

const getElectronIpc = (): ElectronIpcBridge['ipcRenderer'] | null => {
  if (typeof globalThis === 'undefined') return null
  const w = globalThis as unknown as { electron?: ElectronIpcBridge }
  return w.electron?.ipcRenderer ?? null
}

/**
 * Triggers a standard browser/Chromium blob download, preserving the file name
 * and extension. Respects browser security (no silent writes to arbitrary
 * paths). Works both in a plain browser and inside Electron's renderer.
 *
 * @param response - The fetched file response.
 * @param fileName - Target file name (extension preserved).
 * @returns `true` once the download has been triggered.
 */
const browserDownload = async (response: Response, fileName: string): Promise<boolean> => {
  const blob = await response.blob()
  const url = globalThis.URL.createObjectURL(blob)
  try {
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    // Always revoke to avoid leaking Blob URLs, even if the click throws.
    globalThis.URL.revokeObjectURL(url)
  }
  return true
}

/**
 * Downloads a generated report file to the user's machine.
 *
 * Resolution order:
 * 1. If running in Electron AND a `report:save-file` IPC handler is registered
 *    in the main process, delegate the save to it (native save dialog / default
 *    downloads dir) via the existing `window.electron.ipcRenderer` bridge — no
 *    `nodeIntegration` and no new preload API required. If the handler is
 *    absent or declines, fall back to the browser path.
 * 2. Otherwise use the standard Chromium/browser blob download.
 *
 * @param fileUrl - URL to fetch the file from (the report download route).
 * @param fileName - Target file name (extension preserved).
 * @param mimeType - MIME type for the native-save payload.
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

  const ipc = getElectronIpc()
  if (ipc?.invoke) {
    try {
      const buffer = await response.clone().arrayBuffer()
      const saved = await ipc.invoke(REPORT_SAVE_CHANNEL, { fileName, mimeType, data: buffer })
      // A host that implements the channel returns a truthy result on success.
      if (saved === true) return true
    } catch {
      // No handler registered or it threw: fall through to the browser path.
    }
  }

  return browserDownload(response, fileName)
}
