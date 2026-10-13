'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import {
  whatsappService,
  type WhatsAppMessageStats,
} from './services/whatsapp.service'

const messageStatsKey = ['whatsapp', 'message-stats'] as const

const API_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ??
  'http://localhost:3001'

const WS_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_WS_URL ??
  API_URL.replace(/^http/, 'ws').replace(/\/+$/, '')

interface NotificationOptions {
  title: string
  description: string
  backgroundColor: 'success'
}

type SendNotification = (
  options: NotificationOptions,
) => void

interface UseWhatsAppMessageStatsOptions {
  sendNotification?: SendNotification
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isWhatsAppMessageStats(
  value: unknown,
): value is WhatsAppMessageStats {
  if (!isRecord(value)) return false

  return (
    typeof value.incoming === 'number' &&
    typeof value.outgoing === 'number' &&
    typeof value.total === 'number'
  )
}

export function useWhatsAppMessageStats(
  options?: UseWhatsAppMessageStatsOptions,
) {
  const queryClient = useQueryClient()

  // El hook puede usarse sin opciones sin provocar un error.
  const sendNotification = options?.sendNotification

  const sendNotificationRef =
    useRef<SendNotification | undefined>(sendNotification)

  useEffect(() => {
    sendNotificationRef.current = sendNotification
  }, [sendNotification])

  const query = useQuery<WhatsAppMessageStats>({
    queryKey: messageStatsKey,
    queryFn: whatsappService.getMessageStats,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    let socket: WebSocket | undefined
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    function notifyMessageActivity(
      direction: 'incoming' | 'outgoing',
      count: number,
    ) {
      if (count <= 0) return

      const message =
        direction === 'incoming'
          ? count === 1
            ? 'Nuevo mensaje entrante'
            : `${count} nuevos mensajes entrantes`
          : count === 1
            ? 'Nuevo mensaje saliente'
            : `${count} nuevos mensajes salientes`

      sendNotificationRef.current?.({
        title: message,
        description: 'Éxito',
        backgroundColor: 'success',
      })
    }

    function connect() {
      if (stopped) return

      try {
        socket = new WebSocket(WS_URL)
      } catch {
        reconnectTimer = setTimeout(connect, 3000)
        return
      }

      socket.onmessage = (event: MessageEvent<string>) => {
        try {
          const payload: unknown = JSON.parse(event.data)

          if (
            !isRecord(payload) ||
            payload.event !== 'messages:stats' ||
            !isWhatsAppMessageStats(payload.stats)
          ) {
            return
          }

          const nextStats = payload.stats

          const previousStats =
            queryClient.getQueryData<WhatsAppMessageStats>(
              messageStatsKey,
            )

          queryClient.setQueryData<WhatsAppMessageStats>(
            messageStatsKey,
            nextStats,
          )

          // El primer evento inicializa los datos sin notificar.
          if (!previousStats) return

          const incomingDelta = Math.max(
            0,
            nextStats.incoming - previousStats.incoming,
          )

          const outgoingDelta = Math.max(
            0,
            nextStats.outgoing - previousStats.outgoing,
          )

          if (incomingDelta > 0) {
            notifyMessageActivity('incoming', incomingDelta)
          }

          if (outgoingDelta > 0) {
            notifyMessageActivity('outgoing', outgoingDelta)
          }
        } catch {
          // Ignorar mensajes WebSocket que no sean JSON válido.
        }
      }

      socket.onclose = () => {
        if (!stopped) {
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      stopped = true

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }

      socket?.close()
    }
  }, [queryClient])

  return query
}