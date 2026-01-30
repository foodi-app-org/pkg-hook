import { useEffect, useRef, useState } from 'react'

/**
 *
 * @param options
 * @param options.resetOnExit
 */
export function useMouse(
  options: { resetOnExit } = { resetOnExit: false }
) {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const ref = useRef()

  const setMousePosition = (event) => {
    if (ref.current) {
      const rect = event.currentTarget.getBoundingClientRect()

      const x = Math.max(
        0,
        Math.round(
          event.pageX - rect.left - (window.pageXOffset || window.scrollX)
        )
      )

      const y = Math.max(
        0,
        Math.round(
          event.pageY - rect.top - (window.pageYOffset || window.scrollY)
        )
      )

      setPosition({ x, y })
    } else {
      setPosition({ x: event.clientX, y: event.clientY })
    }
  }

  const resetMousePosition = () => {return setPosition({ x: 0, y: 0 })}

  useEffect(() => {
    const element = ref?.current ? ref.current : document
    element.addEventListener('mousemove', setMousePosition)
    if (options.resetOnExit)
      {element.addEventListener('mouseleave', resetMousePosition)}

    return () => {
      element.removeEventListener('mousemove', setMousePosition)
      if (options.resetOnExit)
        {element.removeEventListener('mouseleave', resetMousePosition)}
    }
  }, [ref.current])

  return { ref, ...position }
}
