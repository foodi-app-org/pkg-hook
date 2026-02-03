import { useEffect, useState } from 'react'

export const useKeyPress = (targetKey: string) => {
  const [keyPressed, setKeyPressed] = useState(false)

  useEffect(() => {
    const downHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(true)
      }
    }
    const upHandler = ({ key }: KeyboardEvent) => {
      if (key === targetKey) {
        setKeyPressed(false)
      }
    }

    globalThis.addEventListener('keydown', downHandler)
    globalThis.addEventListener('keyup', upHandler)

    return () => {
      globalThis.removeEventListener('keydown', downHandler)
      globalThis.removeEventListener('keyup', upHandler)
    }
  }, [targetKey])

  return keyPressed
}
