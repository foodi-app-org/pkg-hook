import { useEffect, useState } from 'react'

/**
 *
 * @param ref
 */
export function useDrag2(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref || !ref.current) return undefined
    const target = ref.current
    if (!target) return undefined
    const previousOffset = { x: 0, y: 0 }
    let originMouseX: number = 0
    let originMouseY: number = 0
    /**
     *
     * @param e
     */
    function onMousemove(e: MouseEvent) {
      const { pageX, pageY } = e
      const x = pageX - originMouseX + previousOffset.x
      const y = pageY - originMouseY + previousOffset.y
      target.style.transform = `translate(${x}px, ${y}px)`
    }
    /**
     *
     * @param e
     */
    function onMouseup(e: MouseEvent) {
      previousOffset.x += e.pageX - originMouseX
      previousOffset.y += e.pageY - originMouseY
      globalThis.removeEventListener('mousemove', onMousemove)
      globalThis.removeEventListener('mouseup', onMouseup)
    }
    /**
     *
     * @param e
     */
    function onMousedown(e: MouseEvent) {
      originMouseX = e.pageX
      originMouseY = e.pageY
      globalThis.addEventListener('mousemove', onMousemove)
      globalThis.addEventListener('mouseup', onMouseup)
    }
    target.addEventListener('mousedown', onMousedown)
    return () => {
      target?.removeEventListener('mousedown', onMousedown)
      globalThis?.removeEventListener('mouseup', onMouseup)
      globalThis?.removeEventListener('mousemove', onMousemove)
    }
  }, [ref])
}

export const useDrag = (x: number, y: number) => {
  const [move, setMove] = useState(false)
  const [moveTo, setMoveTo] = useState<[number, number]>([x, y])
  const moveIcon = (e: MouseEvent) => {
    const newX = moveTo[0] + e.movementX
    const newY = moveTo[1] + e.movementY
    setMoveTo([newX, newY])
  }
  const handleMove = (e: MouseEvent) => {
    if (move) moveIcon(e)
  }
  const handleDown = () => {
    setMove(true)
  }
  const handleUp = () => {
    setMove(false)
  }

  return {
    move,
    moveTo,
    handleDown,
    handleUp,
    handleMove
  }
}
