import { useEffect, useState } from 'react'
// use it
// const imageUrl = 'https://example.com/image.jpg';
// const optimizedUrl = useImageOptimization(imageUrl);

export function useImageOptimization (imageUrl) {
  const [optimizedUrl, setOptimizedUrl] = useState(null)

  useEffect(() => {
    const image = new Image()
    image.src = imageUrl

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0, image.width, image.height)

      const optimizedUrl = canvas.toDataURL('image/jpeg', 0.8)
      setOptimizedUrl(optimizedUrl)
    }
  }, [imageUrl])

  return optimizedUrl
}
