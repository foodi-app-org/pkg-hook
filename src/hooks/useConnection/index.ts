export const useConnection = ({ setConnectionStatus }: { setConnectionStatus: React.Dispatch<React.SetStateAction<boolean>> }) => {
  /**
   *
   */
  async function updateConnectionStatus () {
    setConnectionStatus(navigator.onLine)
  }

  if (globalThis.window !== undefined) {
    // Attaching event handler for the online event
    globalThis.window.addEventListener('online', function () {
      updateConnectionStatus()
    })

    // Attaching event handler for the offline event
    globalThis.window.addEventListener('offline', function () {
      updateConnectionStatus()
    })
  }
}
