'use client'

import { useCallback, useEffect, useState } from 'react'

import type { UpdaterEvent } from './types'

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export const useElectronUpdater = () => {
  const [event, setEvent] = useState<UpdaterEvent | null>(null)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    const api = window.updater
    if (!api) return

    let active = true
    let receivedLiveEvent = false
    setIsElectron(true)

    // Se subscribe ANTES de consultar el último estado para evitar carreras.
    const unsubscribe = api.onEvent((next) => {
      receivedLiveEvent = true
      if (active) setEvent(next)
    })

    void api.getState().then((last) => {
      if (active && !receivedLiveEvent && last) setEvent(last)
    }).catch((error: unknown) => {
      if (active && !receivedLiveEvent) {
        setEvent({ status: 'error', message: formatError(error) })
      }
    })

    void api.getVersion().then((version) => {
      if (active) setCurrentVersion(version)
    }).catch(() => {
      // La versión es sólo informativa.
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const checkForUpdates = useCallback(async (): Promise<void> => {
    if (!window.updater) return
    try {
      await window.updater.checkForUpdates()
    } catch (error: unknown) {
      setEvent({ status: 'error', message: formatError(error) })
    }
  }, [])

  const installUpdate = useCallback(async (): Promise<void> => {
    if (!window.updater) return
    try {
      await window.updater.install()
    } catch (error: unknown) {
      setEvent({ status: 'error', message: formatError(error) })
    }
  }, [])

  return {
    event,
    currentVersion,
    isElectron,
    isChecking: event?.status === 'checking',
    isDownloading: event?.status === 'downloading',
    isDownloaded: event?.status === 'downloaded',
    hasError: event?.status === 'error',
    downloadProgress: event?.status === 'downloading' ? event.percent : 0,
    updateVersion: event && 'version' in event ? event.version : null,
    checkForUpdates,
    installUpdate
  }
}
