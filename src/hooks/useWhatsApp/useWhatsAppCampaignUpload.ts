import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  uploadWhatsAppCampaignExcel,
  type UploadWhatsAppCampaignInput,
  type WhatsAppCampaignResponse,
} from './services/whatsapp-campaign.service'
import { whatsappKeys } from './useWhatsApp'


export function useUploadWhatsAppCampaign() {
  const queryClient = useQueryClient()

  return useMutation<WhatsAppCampaignResponse, Error, UploadWhatsAppCampaignInput>({
    mutationFn: uploadWhatsAppCampaignExcel,
    onSuccess: async () => {
      // El estado puede incluir campaignRunning; actualízalo tras crear la campaña.
      await queryClient.invalidateQueries({
        queryKey: whatsappKeys.status(),
        exact: true,
      })
    },
  })
}
