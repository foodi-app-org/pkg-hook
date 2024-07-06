import { useMediaQuery } from 'react-responsive'

export const MEDIA_QUERY = {
  MOBILE: '768px',
  TABLED: '960px'
}

export const useMobile = () => {
  const isMobile = useMediaQuery({ query: `(max-width: ${MEDIA_QUERY.MOBILE})` })
  const isTablet = useMediaQuery({ query: `(max-width: ${MEDIA_QUERY.TABLED}})` })

  return {
    isMobile,
    isTablet
  }
}
