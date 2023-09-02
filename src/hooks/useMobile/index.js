/* eslint-disable no-void */
import { useEffect, useState } from 'react'

export const useMobile = (props) => {
  const { callBack = () => { return null } } = props || {}
  const [innerHeight, setInnerHeight] = useState()
  const [innerWidth, setInnerWidth] = useState()
  let isMobile = false
  useEffect(() => {
    setInnerHeight(window.innerHeight)
    setInnerWidth(window.innerWidth)
    callBack()
  }, [])
  useEffect(() => {
    const handleResize = () => {
      if (!isNaN(window === null || window === void 0 ? void 0 : window.innerHeight) && (window === null || window === void 0 ? void 0 : window.innerHeight) !== innerHeight) {
        setInnerHeight(window.innerHeight)
      }
      if (!isNaN(window.innerWidth) && window.innerWidth !== innerWidth) {
        setInnerWidth(window.innerWidth)
      }
      callBack()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })
  if (typeof window !== 'undefined' && /Mobile/i.test((navigator === null || navigator === void 0 ? void 0 : navigator.userAgent) || (navigator === null || navigator === void 0 ? void 0 : navigator.vendor))) {
    isMobile = true
  }
  return {
    isMobile,
    innerHeight,
    innerWidth
  }
}
