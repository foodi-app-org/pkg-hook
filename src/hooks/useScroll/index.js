import { useEffect, useState } from 'react'

export const useScrollY = () => {
  // Función scroll Para mover verticalmente
  const [offsetY, setOffsetY] = useState(0)
  const handleScroll = () => {return setOffsetY(window.pageYOffset)}

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {return window.removeEventListener('scroll', handleScroll)}
  }, [])
  return {
    offsetY
  }
}


export const useScrollColor = () => {
  const [scrollNav, setScrollNav] = useState(false)
  const changeNav = () => {
    if (window?.scrollY >= 1) {
      setScrollNav(true)
    } else {
      setScrollNav(false)
    }
  }
  useEffect(() => {
    window.addEventListener('scroll', changeNav)
  }, [])
  return {
    scrollNav
  }
}

export const useScrollHook = () => {
  const [style, setStyle] = useState({})

  useEffect(() => {
    let scrollPos = 0
    const handleChangeHeaderStyle = () => {
      if ( document.body?.getBoundingClientRect && document.body.getBoundingClientRect().top > scrollPos) {
        setStyle({})
      } else {
        setStyle({ transform: 'translateY(-300%)' })
      }
      scrollPos = document.body.getBoundingClientRect().top
    }

    window.addEventListener('scroll', handleChangeHeaderStyle)

    return () => {
      window.removeEventListener('scroll', handleChangeHeaderStyle)
    }
  }, [])

  return style
}