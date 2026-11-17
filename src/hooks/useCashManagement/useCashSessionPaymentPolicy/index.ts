'use client'

import { gql, useQuery } from '@apollo/client'

/** Backend is authoritative. This hook never grants payment authorization. */
export interface SessionPaymentPolicy {
  sessionId: string
  configured: boolean
  methodIds: string[]
}

interface QueryData {
  getSessionPaymentPolicy: SessionPaymentPolicy
}

interface QueryVariables {
  sessionId: string
}

export interface UseCashSessionPaymentPolicyOptions {
  sessionId?: string | null
  enabled?: boolean
  pollInterval?: number
}

export const GET_SESSION_PAYMENT_POLICY = gql`
  query GetSessionPaymentPolicy($sessionId: ID!) {
    getSessionPaymentPolicy(sessionId: $sessionId) {
      sessionId
      configured
      methodIds
    }
  }
`

/**
 * Fail closed on network errors or stale session data.
 * A valid `configured: false` response means a legacy session with no policy row.
 * Only the backend can decide whether such a session is allowed to collect.
 */
export function useCashSessionPaymentPolicy({
  sessionId,
  enabled = true,
  pollInterval = 0
}: UseCashSessionPaymentPolicyOptions = {}) {
  const id = typeof sessionId === 'string' ? sessionId.trim() : ''
  const active = Boolean(enabled && id)

  const query = useQuery<QueryData, QueryVariables>(GET_SESSION_PAYMENT_POLICY, {
    variables: { sessionId: id },
    skip: !active,
    fetchPolicy: 'network-only',
    errorPolicy: 'none',
    notifyOnNetworkStatusChange: true,
    pollInterval: active ? pollInterval : 0
  })

  const policy = active && !query.error &&
    query.data?.getSessionPaymentPolicy?.sessionId === id
      ? query.data.getSessionPaymentPolicy
      : null

  return {
    policy,
    configured: policy?.configured === true,
    methodIds: policy?.methodIds ?? [],
    loading: active && query.loading,
    error: query.error,
    ready: active && !query.loading && !query.error && policy !== null,
    refetch: query.refetch
  }
}
