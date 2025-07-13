import { useEffect, useState } from 'react'

/**
 * Custom hook to fetch a free port from the API route `/api/port`.
 *
 * @returns {Object} Object containing the fetched port and loading/error states
 */
export const usePortFetcher = () => {
  const [port, setPort] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPort = async () => {
      try {
        const res = await fetch('/api/port')
        if (!res.ok) throw new Error('Failed to fetch port')

        const data = await res.json()
        setPort(data.port)
      } catch (err: any) {
        console.error('Error fetching port:', err)
        setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPort()
  }, [])

  return { port, loading, error }
}
