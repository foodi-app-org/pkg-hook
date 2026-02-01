/**
 * Broadcast message shape
 */
export interface BroadcastMessage {
  event?: string
  data?: unknown
  [key: string]: unknown
}

/**
 * Receive callback type
 */
export type BroadcastReceiver = (message: BroadcastMessage) => void

/**
 * BroadcastChannel utility based on localStorage events.
 * Keeps original behavior intact.
 *
 * @param {string} name - Channel name
 * @returns {{
 *   receive: (onReceive: BroadcastReceiver) => () => void
 *   post: (message: BroadcastMessage) => void
 * }}
 */
function BroadcastChannel(name: string = 'nextauth.message') {
  return {
    /**
     * Listen for broadcast messages
     * @param onReceive
     *  @returns 
     */
    receive: function (onReceive: BroadcastReceiver): () => void {
      const handler = function (event: StorageEvent): void {
        if (event.key !== name) return

        const message: BroadcastMessage = JSON.parse(
          event.newValue ?? '{}'
        )

        if (message?.event !== 'session' || !message?.data) return

        onReceive(message)
      }

      window.addEventListener('storage', handler)

      return function (): void {
        window.removeEventListener('storage', handler)
      }
    },

    /**
     * Post a broadcast message
     * @param message
     */
    post: function (message: BroadcastMessage): void {
      if (typeof window === 'undefined') return

      try {
        localStorage.setItem(
          name,
          JSON.stringify({
            ...message,
            timestamp: Date.now()
          })
        )
      } catch {
        // localStorage may be unavailable (private mode, Safari < 11, etc.)
        // Messages are silently dropped to preserve original behavior.
      }
    }
  }
}

export { BroadcastChannel }
