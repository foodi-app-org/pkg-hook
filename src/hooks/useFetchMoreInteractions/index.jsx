import { useEffect, useRef, useState } from 'react'

export const useFetchMoreInteractions = ({
  render,
  fetchMore = true,
  callback = () => {}
}) => {
  const loadingRef = useRef()

  const useOnScreen = ref => {
    const [isIntersecting, setIsIntersecting] = useState(false)

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => setIsIntersecting(entry.isIntersecting)
      )
      if (ref.current) observer.observe(ref.current)
      // Remove the observer as soon as the component is unmounted
      return () => { observer.disconnect() }
    }, [ref])

    return isIntersecting
  }

  const isVisible = useOnScreen(loadingRef)

  useEffect(() => {
    if (isVisible && fetchMore) callback()
  }, [isVisible, callback, fetchMore])

  return <div ref={loadingRef}>
    {isVisible && fetchMore ? render || <div style={{ background: 'red' }} >Loading...{isVisible && 'lol'}</div> : null}
  </div>
}