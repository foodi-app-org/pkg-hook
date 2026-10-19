import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import QRCode from 'qrcode'

import { whatsappService } from './services/whatsapp.service'

export interface WhatsAppStatusResponse {
  status: string
  connected: boolean
  campaignRunning?: boolean
  [key: string]: unknown
}

export interface WhatsAppQRResponse {
  status: string
  qr?: string
  dataUrl?: string
  message?: string
  [key: string]: unknown
}

interface UseWhatsAppQROptions {
  enabled?: boolean
}

type UnknownRecord = Record<string, unknown>

const STATUS_POLL_INTERVAL = 3000
const QR_POLL_INTERVAL = 3000

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  qr: () => [...whatsappKeys.all, 'qr'] as const,
  status: () => [...whatsappKeys.all, 'status'] as const,
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unwrapApiPayload(response: unknown): UnknownRecord {
  if (!isRecord(response)) {
    throw new Error('El servidor de WhatsApp devolvió una respuesta inválida.')
  }

  const hasWhatsAppFields =
    'qr' in response ||
    'dataUrl' in response ||
    'connected' in response ||
    typeof response.status === 'string'

  if (hasWhatsAppFields) return response
  if (isRecord(response.data)) return unwrapApiPayload(response.data)

  return response
}

function normalizeStatus(value?: string): string {
  return value?.trim().toLowerCase() ?? 'unknown'
}

/** Estados terminales de QR: dejan de generar solicitudes periódicas. */
export function isSessionEstablishedStatus(value?: string): boolean {
  return ['authenticated', 'ready', 'connected'].includes(normalizeStatus(value))
}

/** Solo ready/connected permiten enviar mensajes. */
export function isReadyStatus(value?: string): boolean {
  return ['ready', 'connected'].includes(normalizeStatus(value))
}

export function statusHasSession(status?: WhatsAppStatusResponse): boolean {
  if (!status) return false

  const normalized = normalizeStatus(status.status)
  if (normalized === 'authenticated' || isReadyStatus(normalized)) return true

  // Un estado explícito desconectado prevalece sobre un `connected` obsoleto.
  if (['disconnected', 'qr_pending', 'closed', 'close', 'logout'].includes(normalized)) {
    return false
  }

  return status.connected === true
}

function getImageMimeType(base64: string): string | undefined {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('PHN2Zy')) return 'image/svg+xml'
  return undefined
}

function resolveImageSource(value: string, allowHttpUrl = false): string | undefined {
  if (/^data:image\//i.test(value)) return value
  if (allowHttpUrl && /^https?:\/\//i.test(value)) return value

  const mimeType = getImageMimeType(value)
  return mimeType ? `data:${mimeType};base64,${value}` : undefined
}

async function normalizeWhatsAppQR(response: unknown): Promise<WhatsAppQRResponse> {
  const payload = unwrapApiPayload(response)
  const qr = typeof payload.qr === 'string' ? payload.qr.trim() : ''
  const providedDataUrl = typeof payload.dataUrl === 'string' ? payload.dataUrl.trim() : ''
  const status = normalizeStatus(typeof payload.status === 'string' ? payload.status : undefined)

  const existingDataUrl = resolveImageSource(providedDataUrl, true)
  const qrImage = resolveImageSource(qr, true)

  if (existingDataUrl || qrImage) {
    return {
      ...payload,
      status,
      qr: qr || undefined,
      dataUrl: existingDataUrl ?? qrImage,
    }
  }

  if (!qr) {
    return { ...payload, status, qr: undefined, dataUrl: undefined }
  }

  try {
    const dataUrl = await QRCode.toDataURL(qr, {
      type: 'image/png',
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#FFFFFF' },
    })

    return { ...payload, status, qr, dataUrl }
  } catch {
    throw new Error('No se pudo generar la imagen del código QR de WhatsApp.')
  }
}

async function getNormalizedWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  const payload = unwrapApiPayload(await whatsappService.getStatus())
  const status = normalizeStatus(typeof payload.status === 'string' ? payload.status : undefined)

  let connected: boolean
  if (status === 'authenticated') {
    // La autenticación ya ocurrió, pero client.isReady() puede ser false.
    connected = false
  } else if (isReadyStatus(status)) {
    connected = true
  } else if (['disconnected', 'qr_pending', 'closed', 'close', 'logout'].includes(status)) {
    connected = false
  } else {
    connected = payload.connected === true
  }

  return { ...payload, status, connected }
}

export function useWhatsAppStatus() {
  return useQuery<WhatsAppStatusResponse>({
    queryKey: whatsappKeys.status(),
    queryFn: getNormalizedWhatsAppStatus,
    staleTime: 0,
    // Se mantiene para detectar una desconexión real después de estar listo.
    refetchInterval: STATUS_POLL_INTERVAL,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

export function useWhatsAppQR(options: UseWhatsAppQROptions = {}) {
  const queryClient = useQueryClient()
  // La consulta comparte la misma queryKey; React Query deduplica las peticiones.
  const statusQuery = useWhatsAppStatus()
  const enabled = options.enabled ?? true

  const cachedQR = queryClient.getQueryData<WhatsAppQRResponse>(whatsappKeys.qr())
  const qrUpdatedAt = queryClient.getQueryState(whatsappKeys.qr())?.dataUpdatedAt ?? 0
  const statusUpdatedAt = queryClient.getQueryState(whatsappKeys.status())?.dataUpdatedAt ?? 0
  const statusNeedsNewQR =
    Boolean(statusQuery.data) &&
    !statusHasSession(statusQuery.data) &&
    statusUpdatedAt > qrUpdatedAt

  const qrIsTerminal = isSessionEstablishedStatus(cachedQR?.status)
  const shouldEnable =
    enabled &&
    !statusHasSession(statusQuery.data) &&
    (!qrIsTerminal || statusNeedsNewQR)

  return useQuery<WhatsAppQRResponse>({
    queryKey: whatsappKeys.qr(),
    queryFn: async () => {
      const previousQR = queryClient.getQueryData<WhatsAppQRResponse>(whatsappKeys.qr())
      const currentStatus = queryClient.getQueryData<WhatsAppStatusResponse>(whatsappKeys.status())
      const previousQRUpdatedAt = queryClient.getQueryState(whatsappKeys.qr())?.dataUpdatedAt ?? 0
      const currentStatusUpdatedAt = queryClient.getQueryState(whatsappKeys.status())?.dataUpdatedAt ?? 0
      const statusConfirmsLaterDisconnect =
        Boolean(currentStatus) &&
        !statusHasSession(currentStatus) &&
        currentStatusUpdatedAt > previousQRUpdatedAt

      // Defensa también para refetch() manual: no llamar al endpoint si el QR
      // ya reportó authenticated/ready/connected, salvo desconexión posterior.
      if (
        previousQR &&
        isSessionEstablishedStatus(previousQR.status) &&
        !statusConfirmsLaterDisconnect
      ) {
        return previousQR
      }

      if (statusHasSession(currentStatus)) {
        return previousQR ?? {
          status: currentStatus?.status ?? 'authenticated',
          message: 'La sesión ya está establecida; no hace falta solicitar otro QR.',
        }
      }

      return normalizeWhatsAppQR(await whatsappService.getQR())
    },
    enabled: shouldEnable,
    staleTime: 0,
    refetchInterval: (query) => {
      const currentStatus = queryClient.getQueryData<WhatsAppStatusResponse>(whatsappKeys.status())
      const currentQRStatus = query.state.data?.status

      if (!enabled) return false
      if (isSessionEstablishedStatus(currentQRStatus)) return false
      if (statusHasSession(currentStatus)) return false

      return QR_POLL_INTERVAL
    },
    refetchOnWindowFocus: (query) => {
      const currentStatus = queryClient.getQueryData<WhatsAppStatusResponse>(whatsappKeys.status())
      return enabled &&
        !isSessionEstablishedStatus(query.state.data?.status) &&
        !statusHasSession(currentStatus)
    },
    refetchOnReconnect: (query) => {
      const currentStatus = queryClient.getQueryData<WhatsAppStatusResponse>(whatsappKeys.status())
      return enabled &&
        !isSessionEstablishedStatus(query.state.data?.status) &&
        !statusHasSession(currentStatus)
    },
    retry: 1,
  })
}

export function useSendWhatsAppMessage() {
  return useMutation({ mutationFn: whatsappService.sendMessage })
}

export function useSendWhatsAppCampaign() {
  return useMutation({ mutationFn: whatsappService.sendCampaign })
}

/** Refresca primero el estado y solo reabre el ciclo de QR si sigue desconectado. */
export function useRefreshWhatsApp() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: whatsappKeys.status(),
      exact: true,
    })

    const currentStatus = queryClient.getQueryData<WhatsAppStatusResponse>(whatsappKeys.status())
    if (statusHasSession(currentStatus)) return

    const currentQR = queryClient.getQueryData<WhatsAppQRResponse>(whatsappKeys.qr())

    if (currentQR && isSessionEstablishedStatus(currentQR.status)) {
      queryClient.setQueryData<WhatsAppQRResponse>(whatsappKeys.qr(), {
        ...currentQR,
        status: currentStatus?.status ?? 'qr_pending',
        qr: undefined,
        dataUrl: undefined,
        message: 'La sesión no está lista. Consultando un nuevo código QR…',
      })
    }

    await queryClient.invalidateQueries({
      queryKey: whatsappKeys.qr(),
      exact: true,
    })
  }
}
