import { useEffect, useRef, useState } from 'react'

export const MEDIA_QUERY = {
  MOBILE: '(max-width: 768px)',
  TABLET: '(max-width: 960px)',
  DESKTOP: '(min-width: 961px)'
}

type UseMobileOptions = {
  callback?: (values: { isMobile: boolean; isTablet: boolean; isDesktop: boolean }) => void
}

export const useMobile = ({ callback }: UseMobileOptions = {}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  const prevValues = useRef({
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })

  useEffect(() => {
    if (globalThis.window === undefined) return undefined

    const mobileQuery = globalThis.matchMedia(MEDIA_QUERY.MOBILE)
    const tabletQuery = globalThis.matchMedia(MEDIA_QUERY.TABLET)
    const desktopQuery = globalThis.matchMedia(MEDIA_QUERY.DESKTOP)

    const updateMatches = () => {
      const newIsMobile = mobileQuery.matches
      const newIsTablet = tabletQuery.matches
      const newIsDesktop = desktopQuery.matches

      const hasChanged =
        newIsMobile !== prevValues.current.isMobile ||
        newIsTablet !== prevValues.current.isTablet ||
        newIsDesktop !== prevValues.current.isDesktop

      if (hasChanged) {
        prevValues.current = {
          isMobile: newIsMobile,
          isTablet: newIsTablet,
          isDesktop: newIsDesktop
        }
        callback?.(prevValues.current)
      }

      setIsMobile(newIsMobile)
      setIsTablet(newIsTablet)
      setIsDesktop(newIsDesktop)
    }

    updateMatches()

    mobileQuery.addEventListener('change', updateMatches)
    tabletQuery.addEventListener('change', updateMatches)
    desktopQuery.addEventListener('change', updateMatches)

    return () => {
      mobileQuery.removeEventListener('change', updateMatches)
      tabletQuery.removeEventListener('change', updateMatches)
      desktopQuery.removeEventListener('change', updateMatches)
    }
  }, [callback])

  return { isMobile, isTablet, isDesktop }
}
