'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  qr: () => [...whatsappKeys.all, 'qr'] as const,
  status: () => [...whatsappKeys.all, 'status'] as const,
}

/**
 *
 * @param value
 */
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 *
 * @param response
 */
function unwrapApiPayload(response: unknown): UnknownRecord {
  if (!isRecord(response)) {
    throw new Error('El servidor de WhatsApp devolvió una respuesta inválida.')
  }

  const isWhatsAppPayload =
    'qr' in response ||
    'connected' in response ||
    typeof response.status === 'string'

  if (isWhatsAppPayload) return response

  if (isRecord(response.data)) return unwrapApiPayload(response.data)

  return response
}

/**
 *
 * @param base64
 */
function getImageMimeType(base64: string): string | undefined {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('PHN2Zy')) return 'image/svg+xml'
  return undefined
}

/**
 *
 * @param value
 * @param allowHttpUrl
 */
function resolveImageSource(
  value: string,
  allowHttpUrl = false,
): string | undefined {
  if (/^data:image\//i.test(value)) return value

  if (allowHttpUrl && /^https?:\/\//i.test(value)) return value

  const mimeType = getImageMimeType(value)
  return mimeType ? `data:${mimeType};base64,${value}` : undefined
}

/**
 *
 * @param response
 */
async function normalizeWhatsAppQR(response: unknown): Promise<WhatsAppQRResponse> {
  const payload = unwrapApiPayload(response)
  const qr = typeof payload.qr === 'string' ? payload.qr.trim() : ''
  const providedDataUrl =
    typeof payload.dataUrl === 'string' ? payload.dataUrl.trim() : ''
  const status =
    typeof payload.status === 'string'
      ? payload.status.trim().toLowerCase()
      : 'unknown'

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
    return {
      ...payload,
      status,
      qr: undefined,
      dataUrl: undefined,
    }
  }

  try {
    // The backend's `qr` is WhatsApp's QR payload (for example, a string
    // beginning with "2@"), not Base64 image data. Encode that whole string.
    const dataUrl = await QRCode.toDataURL(qr, {
      type: 'image/png',
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })

    return { ...payload, status, qr, dataUrl }
  } catch {
    throw new Error('No se pudo generar la imagen del código QR de WhatsApp.')
  }
}

/**
 *
 * @param status
 */
function isReadyStatus(status: string): boolean {
  // `ready` is the backend state used by client.isReady().
  // `connected` is accepted for compatibility with other API versions.
  return status === 'ready' || status === 'connected'
}

/**
 *
 */
async function getNormalizedWhatsAppStatus(): Promise<WhatsAppStatusResponse> {
  const response = await whatsappService.getStatus()
  const payload = unwrapApiPayload(response)
  const status =
    typeof payload.status === 'string'
      ? payload.status.trim().toLowerCase()
      : 'unknown'

  return {
    ...payload,
    status,
    // Do not treat `authenticated` as ready. The backend's send route checks
    // client.isReady(), so sending before status `ready` returns HTTP 503.
    connected: payload.connected === true || isReadyStatus(status),
  }
}

/**
 *
 * @param options
 */
export function useWhatsAppQR(options: UseWhatsAppQROptions = {}) {
  const enabled = options.enabled ?? true

  return useQuery<WhatsAppQRResponse>({
    queryKey: whatsappKeys.qr(),
    queryFn: async () => normalizeWhatsAppQR(await whatsappService.getQR()),
    enabled,
    staleTime: 0,
    refetchInterval: enabled ? 3000 : false,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

/**
 *
 */
export function useWhatsAppStatus() {
  return useQuery<WhatsAppStatusResponse>({
    queryKey: whatsappKeys.status(),
    queryFn: getNormalizedWhatsAppStatus,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}

/**
 *
 */
export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: whatsappService.sendMessage,
  })
}

/**
 *
 */
export function useSendWhatsAppCampaign() {
  return useMutation({
    mutationFn: whatsappService.sendCampaign,
  })
}

/**
 *
 */
export function useRefreshWhatsApp() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: whatsappKeys.qr() }),
      queryClient.invalidateQueries({ queryKey: whatsappKeys.status() }),
    ])
}
