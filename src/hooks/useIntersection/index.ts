import { useEffect, useState } from 'react'

export const useOnScreen = (threshold = 0.6) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)

  useEffect(
    () => {
      let observer: IntersectionObserver | undefined
      if (ref) {
        observer = new IntersectionObserver(
          ([entry]) => {
            setIsVisible(entry.isIntersecting)
          },
          {
            // rootMargin,
            threshold
          }
        )
        observer.observe(ref)
      }

      return () => {
        if (ref && observer) observer.unobserve(ref)
      }
    },
    [ref]
  )

  return [setRef, isVisible]
}

const defaultObserverOptions = {
  root: null,
  threshold: 0.1,
  rootMargin: '0px'
}

type UseIntersectionObserverParams = {
  active?: boolean
  disconnect?: boolean
  el: { current: HTMLElement | null }
  options?: IntersectionObserverInit
  onEnter?: () => void
  out?: () => void
}

export const useIntersectionObserver = ({
  active = true,
  disconnect = false,
  el,
  options = defaultObserverOptions,
  onEnter = () => {},
  out = () => {}
}: UseIntersectionObserverParams) => {
  const [onScreen, setOnScreen] = useState<boolean>(false)
  useEffect(() => {
    let observer: IntersectionObserver | undefined
    const refEl = el.current
    if (typeof IntersectionObserver !== 'undefined' && active && refEl) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (disconnect) {
            if (entry.isIntersecting) {
              onEnter()
              setOnScreen(true)
            } else {
              out()
              setOnScreen(false)
            }
          }
          if (!disconnect) {
            onEnter()
            setOnScreen(true)
          }
        })
      }, options)
      observer.observe(refEl)
    }
    return () => {
      if (disconnect) {
        if (observer) observer.disconnect()
      }
      if (!disconnect) {
        if (el && observer && refEl) observer.unobserve(refEl)
      }
    }
  }, [el, onEnter, active, options, disconnect, out])
  return {
    onScreen
  }
}
