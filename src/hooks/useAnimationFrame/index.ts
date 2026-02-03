import { useEffect, useRef } from 'react'

export const useAnimationFrame = (
  callback: (diff: number) => void,
  start: number,
  end: number,
  duration: number = 1000
) => {
  const functionRef = useRef<number | null>(null)
  const delta = Math.abs(start - end)
  const frameCount = Math.ceil(60 * (duration / 1000))
  const iteration = useRef<number>(frameCount)
  useEffect(() => {
    const animate = (rafId: number) => {
      if (iteration.current <= 0) {
        cancelAnimationFrame(rafId)
        iteration.current = frameCount
        return
      }

      callback(Math.max(delta / iteration.current, 1))
      iteration.current--
      functionRef.current = requestAnimationFrame(animate)
    }

    if (delta > 0) functionRef.current = requestAnimationFrame(animate)

    return () => {
      if (functionRef.current !== null) {
        cancelAnimationFrame(functionRef.current)
      }
    }
  }, [callback, delta, frameCount, iteration])
}
