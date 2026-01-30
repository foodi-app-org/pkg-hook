import { useState, useEffect } from 'react'

/**
 * A custom React hook that provides the current window size.
 * @returns An object containing the current window width and height
 */
export function useWindowSize () {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<{ width: number | undefined; height: number | undefined }>({
    width: undefined,
    height: undefined
  })

  useEffect(() => {
    // Handler to call on window resize
    /**
     *
     */
    function handleResize () {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => {return window.removeEventListener('resize', handleResize)}
  }, []) // Empty array ensures that effect is only run on mount

  return windowSize
}
// Como se usa

// 1 -const size = useWindowSize();
// 2  <div>
// {size.width}px / {size.height}px
// </div>
