import { useRef, useState, useEffect } from 'react'

/**
 *  @returns
 */
export function useHover () {
  const [value, setValue] = useState(false)

  const ref = useRef<HTMLElement | null>(null)

  const handleMouseOver = () => { return setValue(true) }
  const handleMouseOut = () => { return setValue(false) }

  useEffect(
    () => {
      const node = ref.current
      if (node) {
        node.addEventListener('mouseover', handleMouseOver)
        node.addEventListener('mouseout', handleMouseOut)

        return () => {
          node.removeEventListener('mouseover', handleMouseOver)
          node.removeEventListener('mouseout', handleMouseOut)
        }
      }
      return undefined
    },
    [] // Recall only if ref changes
  )

  return [ref, value]
}
