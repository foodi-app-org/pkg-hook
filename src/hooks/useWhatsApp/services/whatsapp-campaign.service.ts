export interface UploadWhatsAppCampaignInput {
  file: File
  campaignName: string
  message: string
}

export interface WhatsAppCampaignResponse {
  success?: boolean
  campaignId?: string
  id?: string
  status?: string
  message?: string
  totalRecipients?: number
  [key: string]: unknown
}

const API_URL = (
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL ?? 'http://localhost:3001'
).replace(/\/+$/, '')

const WHATSAPP_CAMPAIGN_UPLOAD_URL = `${API_URL}/api/campaign`

function getApiError(payload: unknown): string | undefined {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return undefined
  }

  const record = payload as Record<string, unknown>

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }

  if (Array.isArray(record.message)) {
    const messages = record.message.filter(
      (item): item is string =>
        typeof item === 'string' && item.trim().length > 0
    )

    if (messages.length > 0) {
      return messages.join(', ')
    }
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error
  }

  return undefined
}

export async function uploadWhatsAppCampaignExcel(
  input: UploadWhatsAppCampaignInput
): Promise<WhatsAppCampaignResponse> {
  if (!(input.file instanceof File)) {
    throw new Error('Debes seleccionar un archivo Excel válido.')
  }

  if (!input.campaignName.trim()) {
    throw new Error('El nombre de la campaña es obligatorio.')
  }

  if (!input.message.trim()) {
    throw new Error('El mensaje de la campaña es obligatorio.')
  }

  const formData = new FormData()

  formData.append('file', input.file, input.file.name)
  formData.append('campaignName', input.campaignName.trim())
  formData.append('message', input.message.trim())

  let response: Response

  try {
    response = await fetch(WHATSAPP_CAMPAIGN_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new Error(
      'No fue posible conectar con el servidor. Verifica que el backend esté activo y que permita solicitudes desde el frontend.'
    )
  }

  const responseText = await response.text()

  let payload: unknown

  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      payload = responseText
    }
  }

  if (!response.ok) {
    throw new Error(
      getApiError(payload) ??
        `No se pudo crear la campaña (HTTP ${response.status}).`
    )
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload)
  ) {
    return payload as WhatsAppCampaignResponse
  }

  return {
    success: true,
    message:
      typeof payload === 'string' && payload.trim()
        ? payload
        : 'El servidor respondió correctamente a la solicitud de creación de campaña.',
  }
}