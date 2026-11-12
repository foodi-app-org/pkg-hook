/** Contrato IPC tipado entre Main, Preload y Next.js. */
export type UpdaterEvent =
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available'; currentVersion: string }
  | {
      status: 'downloading'
      version: string
      percent: number
      transferred: number
      total: number
      bytesPerSecond: number
    }
  | { status: 'downloaded'; version: string }
  | { status: 'error'; message: string }

export interface ElectronUpdaterAPI {
  onEvent: (callback: (event: UpdaterEvent) => void) => () => void
  getState: () => Promise<UpdaterEvent | null>
  getVersion: () => Promise<string>
  checkForUpdates: () => Promise<void>
  install: () => Promise<void>
}
