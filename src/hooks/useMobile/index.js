import { useEffect, useState } from 'react'

export const useMobile = (props) => {
  const { callBack = () => {} } = props || {}
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [innerHeight, setInnerHeight] = useState(0)
  const [innerWidth, setInnerWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      // Verificar si window está disponible (es decir, estamos en el lado del cliente)
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        const height = window.innerHeight
        setInnerWidth(width)
        setInnerHeight(height)
        callBack()

        // Determinar el tipo de dispositivo
        if (width <= 768) {
          setIsTablet(true)
        } else if (width <= 960) {
          setIsMobile(true)
        } else {
          setIsMobile(false)
        }
      }
    }

    // Ejecutar handleResize al cargar y al cambiar el tamaño de la pantalla
    handleResize()
    window.addEventListener('resize', handleResize)

    // Eliminar el event listener al desmontar el componente
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [callBack])

  return {
    isMobile,
    isTablet,
    innerHeight,
    innerWidth
  }
}
