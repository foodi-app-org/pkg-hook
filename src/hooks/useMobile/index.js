import { useEffect, useState } from 'react'

export const MEDIA_QUERY = {
  MOBILE: '(max-width: 768px)',
  TABLET: '(max-width: 960px)'
}

export const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mobileQuery = window.matchMedia(MEDIA_QUERY.MOBILE)
    const tabletQuery = window.matchMedia(MEDIA_QUERY.TABLET)

    const updateMatches = () => {
      setIsMobile(mobileQuery.matches)
      setIsTablet(tabletQuery.matches)
    }

    updateMatches() // inicializa

    mobileQuery.addEventListener('change', updateMatches)
    tabletQuery.addEventListener('change', updateMatches)

    return () => {
      mobileQuery.removeEventListener('change', updateMatches)
      tabletQuery.removeEventListener('change', updateMatches)
    }
  }, [])

  return { isMobile, isTablet }
}
