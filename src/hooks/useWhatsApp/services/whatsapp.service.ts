const API_URL = (
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ?? 'http://localhost:3001'
).replace(/\/+$/, '')

export type WhatsAppMessageStats = {
  incoming: number
  outgoing: number
  total: number
  updatedAt: string | null
}

export type WhatsAppStatus = {
  status?: string
  connected?: boolean
  campaignRunning?: boolean
  [key: string]: unknown
}

export type WhatsAppQR = {
  status?: string
  qr?: string | null
  dataUrl?: string | null
  message?: string
  [key: string]: unknown
}

export type SendWhatsAppMessageInput = {
  phone: string
  message: string
}

export type SendWhatsAppMessageResponse = {
  success: boolean
  phone?: string
  message?: string
}

export type SendWhatsAppCampaignInput = {
  file: File
  message: string
}

export type SendWhatsAppCampaignResponse = {
  success: boolean
  campaignId: number
  campaignName: string
  totalContacts: number
  message: string
}

type ApiErrorBody = {
  error?: string
  message?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null)
  }

  return response.text().catch(() => '')
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = new Headers(options.headers)

  // Do not set Content-Type manually for FormData. The browser must add
  // the multipart boundary required by multer on the backend.
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
    })
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor de WhatsApp (${API_URL}). Verifica que el backend esté ejecutándose y que la URL sea correcta.`,
    )
  }

  const body = await readResponseBody(response)

  if (!response.ok) {
    const apiError = isRecord(body) ? (body as ApiErrorBody) : undefined
    const message =
      apiError?.error ??
      apiError?.message ??
      (typeof body === 'string' && body.trim()
        ? body
        : `Error HTTP ${response.status} en ${endpoint}`)

    throw new Error(message)
  }

  if (response.status === 204 || body === '') {
    return undefined as T
  }

  return body as T
}

export const whatsappService = {
  getQR: () => request<WhatsAppQR>('/api/qr'),

  getStatus: () => request<WhatsAppStatus>('/api/status'),

  // The Express backend expects { phone, message }, not { to, message }.
  sendMessage: (data: SendWhatsAppMessageInput) =>
    request<SendWhatsAppMessageResponse>('/api/send', {
      method: 'POST',
      body: JSON.stringify({
        phone: data.phone.trim(),
        message: data.message,
      }),
    }),

  // POST /api/campaign uses multer: `file` and `message` must be multipart fields.
  sendCampaign: ({ file, message }: SendWhatsAppCampaignInput) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('message', message)

    return request<SendWhatsAppCampaignResponse>('/api/campaign', {
      method: 'POST',
      body: formData,
    })
  },
  getMessageStats: () =>
  request<WhatsAppMessageStats>('/api/messages/stats'),
}
