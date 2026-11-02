import { useSubscription } from '@apollo/client'

import { REPORT_JOB_UPDATED } from './queries'
import { ReportJobUpdate } from './types'

/**
 * Subscribes to lifecycle updates for a single report job over the WebSocket
 * link. The server filters by `jobId` so only the owner receives events.
 *
 * @param jobId - The job id to listen to, or null to pause the subscription.
 * @param onUpdate - Callback invoked on each update.
 */
export const useReportJobSubscription = (
  jobId: string | null,
  onUpdate: (update: ReportJobUpdate) => void
): void => {
  useSubscription(REPORT_JOB_UPDATED, {
    variables: { jobId: jobId ?? '' },
    skip: !jobId,
    onData: ({ data }) => {
      const update = data?.data?.reportJobUpdated as ReportJobUpdate | undefined
      if (update) onUpdate(update)
    }
  })
}
