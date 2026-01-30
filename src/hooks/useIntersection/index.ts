import { useEffect, useState } from 'react'

export const useOnScreen = (threshold = 0.6) => {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState(null)

  useEffect(
    () => {
      let observer
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

export const useIntersectionObserver = ({
  active = true,
  disconnect,
  el,
  options = defaultObserverOptions,
  onEnter = () => {},
  out = () => {}
}) => {
  const [onScreen, setOnScreen] = useState()
  useEffect(() => {
    let observer
    const refEl = el.current
    if (IntersectionObserver && active && refEl) {
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
         
        observer === null || observer === void 0 ? void 0 : observer.disconnect(refEl)
      }
      if (!disconnect) {
        if (el && observer) observer.unobserve(refEl)
      }
    }
  }, [el, onEnter, active, options])
  return {
    onScreen
  }
}
