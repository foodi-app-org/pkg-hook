import { useEffect, useState } from 'react'

// Función scroll Para rotar
export const useScrollRotate = () => {
  const [position, setPosition] = useState(0)

  useEffect(() => {
    const handleScroll = () => { return setPosition(window.scrollY) }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { position }
}
