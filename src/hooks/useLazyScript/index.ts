import { useEffect, useState } from 'react'

export const useLazyScript = (src, delay = null) => {
  const [status, setStatus] = useState(src ? 'loading' : 'idle')

  useEffect(() => {
    if (!src) {
      setStatus('idle')
      return 'idle'
    }

    let script = document.querySelector(`script[src='${src}']`)
    let timeout = null

    if (!script) {
      if (delay) {
        timeout = setTimeout(() => {
          injectScript()
          // Add event listener after the script is added
          script.addEventListener('load', setStateStatus)
          script.addEventListener('error', setStateStatus)
        }, delay)
      } else {
        injectScript()
      }
    } else {
      setStatus(script.getAttribute('data-status'))
    }

    const setStateStatus = (event) => {
      setStatus(event.type === 'load' ? 'ready' : 'error')
    }

    // code to inject script
    /**
     *
     */
    function injectScript () {
      script = document.createElement('script')
      script.src = src
      script.async = true
      script.setAttribute('data-status', 'loading')
      document.body.appendChild(script)

      const setDataStatus = (event) => {
        script.setAttribute(
          'data-status',
          event.type === 'load' ? 'ready' : 'error'
        )
      }

      script.addEventListener('load', setDataStatus)
      script.addEventListener('error', setDataStatus)
    }

    if (script) {
      // script will be be undefined available when its delayed hence check it before adding listener
      script.addEventListener('load', setStateStatus)
      script.addEventListener('error', setStateStatus)
    }

    return () => {
      if (script) {
        script.removeEventListener('load', setStateStatus)
        script.removeEventListener('error', setStateStatus)
      }
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [src])

  return status
}
