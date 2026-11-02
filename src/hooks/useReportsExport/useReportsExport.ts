import { useApolloClient, useMutation, useQuery } from '@apollo/client'
import { useCallback, useEffect, useRef, useState } from 'react'

import { downloadReportFile } from './downloadReportFile'
import {
  CANCEL_REPORT_JOB,
  DOWNLOAD_REPORT,
  GET_RECENT_REPORT_REQUESTS,
  REQUEST_REPORT_EXPORT,
  RETRY_REPORT_JOB
} from './queries'
import {
  ReportErrorEntry,
  ReportExportInput,
  ReportJob,
  ReportJobUpdate,
  SendNotification
} from './types'
import { useReportJobSubscription } from './useReportJobSubscription'

/**
 * Builds the report download URL for a generated file.
 *
 * Uses the dedicated, non-deleting report route (`/api/reports/download/...`)
 * instead of the generic `/api/files` proxy, which deletes files after serving.
 * This lets a report be re-downloaded from the history while it remains valid;
 * retention is owned by the backend worker (per-job `expiresAt`).
 *
 * @param fileName - The generated report file name.
 * @returns The report download URL used to fetch the file.
 */
const buildFileUrl = (fileName: string): string =>
  `/api/reports/download/${encodeURIComponent(fileName)}`

const noop: SendNotification = () => undefined

/**
 * Options for {@link useReportsExport}.
 */
export interface UseReportsExportOptions {
  /** Notification sink (toast). Defaults to a no-op. */
  sendNotification?: SendNotification
  /** How many recent requests to load (default 5). */
  recentLimit?: number
  /** Enable automatic download when a session-initiated job completes. */
  autoDownload?: boolean
}

/**
 * Coordinator hook for the report export module. Exposes a single, cohesive API
 * for the export screen:
 * - submitting an export request,
 * - tracking the active job via WebSocket (with polling fallback),
 * - auto-downloading the file when a job started in this session completes
 *   (de-duplicated so re-opening the screen never re-downloads history),
 * - listing the latest requests, and
 * - re-downloading, cancelling and retrying jobs.
 *
 * Business logic lives here (not in components), per the module architecture.
 *
 * @param options - Behavior options.
 * @returns The export state and actions.
 */
export const useReportsExport = (options: UseReportsExportOptions = {}) => {
  const { sendNotification = noop, recentLimit = 5, autoDownload = true } = options
  const client = useApolloClient()

  const [activeJob, setActiveJob] = useState<ReportJob | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Jobs that were started during THIS session and are eligible for one
  // automatic download. Guards against auto-downloading historical jobs and
  // against duplicate downloads of the same job.
  const sessionJobIds = useRef<Set<string>>(new Set())
  const downloadedJobIds = useRef<Set<string>>(new Set())
  // Jobs whose terminal transition has already been handled, so the side
  // effects (history refresh, auto-download, failure toast) run exactly once
  // regardless of whether the subscription or the polling fallback observes the
  // transition first.
  const handledTerminalIds = useRef<Set<string>>(new Set())
  // Prevents seeding an in-flight job from history more than once per mount.
  const reconciledRef = useRef(false)

  const {
    data: recentData,
    loading: recentLoading,
    refetch: refetchRecent
  } = useQuery(GET_RECENT_REPORT_REQUESTS, {
    variables: { limit: recentLimit },
    fetchPolicy: 'cache-and-network'
  })

  const [requestExport] = useMutation(REQUEST_REPORT_EXPORT)
  const [cancelJob] = useMutation(CANCEL_REPORT_JOB)
  const [retryJob] = useMutation(RETRY_REPORT_JOB)

  const recentRequests: ReportJob[] = recentData?.getRecentReportRequests?.jobs ?? []

  /**
   * Fetches the downloadable file name and triggers the OS download.
   * De-duplicated per job id so a completed job is downloaded at most once
   * automatically.
   */
  const performDownload = useCallback(
    async (job: ReportJob, isAuto: boolean): Promise<boolean> => {
      if (isAuto && downloadedJobIds.current.has(job.id)) return false
      try {
        const { data } = await client.query({
          query: DOWNLOAD_REPORT,
          variables: { jobId: job.id },
          fetchPolicy: 'network-only'
        })
        const result = data?.downloadReport
        if (!result?.success || !result?.fileName) {
          sendNotification({
            title: 'Descarga no disponible',
            description: result?.message ?? 'El archivo no está disponible.',
            backgroundColor: 'error'
          })
          return false
        }
        await downloadReportFile(buildFileUrl(result.fileName), result.fileName, result.mimeType ?? undefined)
        downloadedJobIds.current.add(job.id)
        sendNotification({
          title: 'Reporte descargado',
          description: `Archivo generado: ${result.fileName}`,
          backgroundColor: 'success'
        })
        return true
      } catch (e) {
        sendNotification({
          title: 'Error al descargar',
          description: e instanceof Error ? e.message : 'Error desconocido',
          backgroundColor: 'error'
        })
        return false
      }
    },
    [client, sendNotification]
  )

  /**
   * Idempotently reacts to a job reaching a terminal state: refreshes history
   * and, for a session-initiated completed job, triggers the auto-download.
   * Deduped per job id so it runs exactly once even if both the subscription
   * and the polling fallback observe the same transition.
   */
  const handleTerminal = useCallback(
    (job: ReportJob) => {
      if (handledTerminalIds.current.has(job.id)) return
      handledTerminalIds.current.add(job.id)

      void refetchRecent()
      if (job.status === 'COMPLETED') {
        if (autoDownload && sessionJobIds.current.has(job.id)) {
          void performDownload(job, true)
        }
      } else if (job.status === 'FAILED') {
        sendNotification({
          title: 'Generación fallida',
          description: job.errorMessage ?? 'No se pudo generar el reporte.',
          backgroundColor: 'error'
        })
      }
    },
    [autoDownload, performDownload, refetchRecent, sendNotification]
  )

  // Live updates for the active job. Only updates state here; terminal side
  // effects are handled by the effect below (never inside a state updater).
  // Apollo re-subscribes automatically on reconnect.
  useReportJobSubscription(
    activeJob && (activeJob.status === 'PENDING' || activeJob.status === 'PROCESSING') ? activeJob.id : null,
    useCallback((update: ReportJobUpdate) => {
      setActiveJob((prev) => {
        if (!prev || prev.id !== update.jobId) return prev
        return {
          ...prev,
          status: update.status,
          progress: update.progress,
          stage: update.stage ?? prev.stage,
          fileName: update.fileName ?? prev.fileName,
          errorMessage: update.errorMessage ?? prev.errorMessage
        }
      })
    }, [])
  )

  // Terminal-state side effects, driven by the observed active job status from
  // any source (subscription or polling). Deduped inside handleTerminal.
  useEffect(() => {
    if (!activeJob) return
    const terminal =
      activeJob.status === 'COMPLETED' ||
      activeJob.status === 'FAILED' ||
      activeJob.status === 'CANCELLED' ||
      activeJob.status === 'EXPIRED'
    if (terminal) handleTerminal(activeJob)
  }, [activeJob, handleTerminal])

  /**
   * Submits an export request. Prevents double submission. When the backend
   * returns an already-completed job (small/fast exports), the download is
   * triggered immediately.
   *
   * @param input - The export request.
   * @returns The created job, or null on validation/transport error.
   */
  const submit = useCallback(
    async (input: ReportExportInput): Promise<ReportJob | null> => {
      if (isSubmitting) return null
      setIsSubmitting(true)
      setError(null)
      try {
        const { data } = await requestExport({ variables: { input } })
        const payload = data?.requestReportExport
        if (!payload?.success || !payload?.job) {
          const errs: ReportErrorEntry[] = payload?.errors ?? []
          const message = payload?.message ?? errs[0]?.message ?? 'No se pudo generar el reporte.'
          setError(message)
          sendNotification({ title: 'Solicitud inválida', description: message, backgroundColor: 'error' })
          return null
        }

        const job: ReportJob = payload.job
        sessionJobIds.current.add(job.id)
        // A fresh submission is eligible for terminal handling again even if an
        // id somehow repeats (retry creates a new id, so this is defensive).
        handledTerminalIds.current.delete(job.id)
        setActiveJob(job)
        void refetchRecent()

        // Terminal handling (incl. fast-path auto-download) is driven by the
        // activeJob effect; here we only surface the in-progress notification.
        if (job.status !== 'COMPLETED') {
          sendNotification({
            title: 'Reporte en proceso',
            description: job.status === 'PENDING' ? 'La solicitud fue encolada.' : 'Generando el reporte...',
            backgroundColor: 'info'
          })
        }
        return job
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error desconocido'
        setError(message)
        sendNotification({ title: 'Error', description: message, backgroundColor: 'error' })
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, requestExport, refetchRecent, sendNotification]
  )

  /**
   * Manually downloads a completed job (e.g. from the history list). Never
   * de-duplicated, so the user can re-download on demand while the file lives.
   *
   * @param job - A completed job.
   */
  const downloadReport = useCallback(
    async (job: ReportJob): Promise<boolean> => performDownload(job, false),
    [performDownload]
  )

  /**
   * Cancels an unfinished job.
   */
  const cancel = useCallback(
    async (jobId: string): Promise<void> => {
      const { data } = await cancelJob({ variables: { jobId } })
      const payload = data?.cancelReportJob
      sendNotification({
        title: payload?.success ? 'Solicitud cancelada' : 'No se pudo cancelar',
        description: payload?.message ?? '',
        backgroundColor: payload?.success ? 'success' : 'error'
      })
      void refetchRecent()
      if (payload?.job && activeJob?.id === jobId) setActiveJob(payload.job)
    },
    [cancelJob, refetchRecent, sendNotification, activeJob]
  )

  /**
   * Retries a failed job as a new request and tracks it in this session.
   */
  const retry = useCallback(
    async (jobId: string): Promise<void> => {
      const { data } = await retryJob({ variables: { jobId } })
      const payload = data?.retryReportJob
      if (payload?.success && payload.job) {
        sessionJobIds.current.add(payload.job.id)
        handledTerminalIds.current.delete(payload.job.id)
        // Terminal handling (incl. auto-download for a fast retry) is driven by
        // the activeJob effect once this state lands.
        setActiveJob(payload.job)
      }
      sendNotification({
        title: payload?.success ? 'Reintentando' : 'No se pudo reintentar',
        description: payload?.message ?? '',
        backgroundColor: payload?.success ? 'info' : 'error'
      })
      void refetchRecent()
    },
    [retryJob, refetchRecent, sendNotification]
  )

  // Reconciliation on mount / route re-entry: if there is no active job but the
  // history still has one in flight (PENDING/PROCESSING), adopt it so the UI
  // reconnects to its progress. It is NOT added to sessionJobIds, so it will
  // never trigger an automatic download (only session-initiated jobs do). This
  // reconciles state with the backend independently of the WebSocket.
  useEffect(() => {
    if (reconciledRef.current) return
    if (activeJob) {
      reconciledRef.current = true
      return
    }
    const inFlight = recentRequests.find(
      (j) => j.status === 'PENDING' || j.status === 'PROCESSING'
    )
    if (inFlight) {
      reconciledRef.current = true
      setActiveJob(inFlight)
    }
  }, [activeJob, recentRequests])

  // Polling fallback: if the active job is still running and we haven't had a
  // socket update in a while, poll its status so progress keeps advancing even
  // when the WebSocket is unavailable. Controlled (every 4s, only while active).
  useEffect(() => {
    if (!activeJob) return undefined
    if (activeJob.status !== 'PENDING' && activeJob.status !== 'PROCESSING') return undefined

    let cancelled = false
    const interval = setInterval(() => {
      void (async () => {
        try {
          const { data } = await client.query({
            query: GET_RECENT_REPORT_REQUESTS,
            variables: { limit: recentLimit },
            fetchPolicy: 'network-only'
          })
          if (cancelled) return
          const jobs: ReportJob[] = data?.getRecentReportRequests?.jobs ?? []
          const fresh = jobs.find((j) => j.id === activeJob.id)
          // Only advance state; terminal side effects are handled by the
          // activeJob effect (deduped), avoiding double auto-download.
          if (fresh && (fresh.status !== activeJob.status || fresh.progress !== activeJob.progress)) {
            setActiveJob(fresh)
          }
        } catch {
          // transient; next tick retries
        }
      })()
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeJob, client, recentLimit])

  return {
    activeJob,
    isSubmitting,
    isProcessing: activeJob?.status === 'PENDING' || activeJob?.status === 'PROCESSING',
    progress: activeJob?.progress ?? 0,
    error,
    recentRequests,
    isLoadingRecent: recentLoading,
    submit,
    downloadReport,
    cancel,
    retry,
    refetchRecent: () => {
      void refetchRecent()
    }
  }
}
