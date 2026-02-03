import { useEffect, useState } from 'react'

export const useLazyScript = (src: string | undefined, delay: number | null = null) => {
  const [status, setStatus] = useState<string>(src ? 'loading' : 'idle')

  useEffect(() => {
    if (!src) {
      setStatus('idle')
      return
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src='${src}']`)
    let timeout: ReturnType<typeof setTimeout> | null = null

    if (script === null) {
      if (delay) {
        timeout = setTimeout(() => {
          injectScript()
          // Add event listener after the script is added
          if (script) {
            script.addEventListener('load', setStateStatus)
            script.addEventListener('error', setStateStatus)
          }
        }, delay)
      } else {
        injectScript()
      }
    } else {
      // Prefer .dataset over getAttribute and handle null
      setStatus(script.dataset.status ?? 'idle')
    }

    /**
     *
     * @param event
     */
    function setStateStatus(event: Event) {
      setStatus(event.type === 'load' ? 'ready' : 'error')
    }

    // code to inject script
    /**
     *
     */
    function injectScript () {
      script = document.createElement('script')
      script.src = src!
      script.async = true
      script.dataset.status = 'loading'
      document.body.appendChild(script)

      /**
       *
       * @param event
       */
      function setDataStatus(event: Event) {
        if (script) {
          script.dataset.status = event.type === 'load' ? 'ready' : 'error'
        }
      }

      script.addEventListener('load', setDataStatus)
      script.addEventListener('error', setDataStatus)
    }

    if (script) {
      // script will be undefined when it's delayed, hence check it before adding listener
      script.addEventListener('load', setStateStatus)
      script.addEventListener('error', setStateStatus)
    }

    // eslint-disable-next-line
    return () => {
      if (script) {
        script.removeEventListener('load', setStateStatus)
        script.removeEventListener('error', setStateStatus)
      }
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [src, delay])

  return status
}
