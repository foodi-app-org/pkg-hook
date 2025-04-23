export const useConnection = ({ setConnectionStatus }) => {
  async function updateConnectionStatus () {
    if (navigator.onLine) {
      setConnectionStatus(navigator.onLine)
    } else {
      setConnectionStatus(navigator.onLine)
    }
  }

  // Attaching event handler for the load event
  //   window.addEventListener('load', updateConnectionStatus);

  if (typeof window !== 'undefined') {
    // Attaching event handler for the online event
    window.addEventListener('online', function () {
      updateConnectionStatus()
    })

    // Attaching event handler for the offline event
    window.addEventListener('offline', function () {
      updateConnectionStatus()
    })
  }
}
