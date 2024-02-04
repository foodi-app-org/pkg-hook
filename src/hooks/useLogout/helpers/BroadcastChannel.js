function BroadcastChannel (name = 'nextauth.message') {
  return {
    receive: function (onReceive) {
      const handler = function (event) {
        if (event.key !== name) return
        const message = JSON.parse(event.newValue ?? '{}')
        if (message?.event !== 'session' || !message?.data) return
        onReceive(message)
      }
      window.addEventListener('storage', handler)
      return function () {
        window.removeEventListener('storage', handler)
      }
    },
    post: function (message) {
      if (typeof window === 'undefined') return
      try {
        localStorage.setItem(
          name,
          JSON.stringify({ ...message, timestamp: Date.now() })
        )
      } catch {
        // The localStorage API isn't always available.
        // It won't work in private mode prior to Safari 11 for example.
        // Notifications are simply dropped if an error is encountered.
      }
    }
  }
}

export { BroadcastChannel }
