import { useEffect, useState } from 'react'

/**
 *
 * @param imageUrl
 * @returns {number | null} weight in bytes
 */
export function useImageWeight (imageUrl: string) {
  const [weight, setWeight] = useState<number | null>(null)

  useEffect(() => {
    const image = new Image()
    image.src = imageUrl

    image.onload = () => {
      const xhr = new XMLHttpRequest()
      xhr.open('HEAD', imageUrl, true)
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const contentLength = xhr.getResponseHeader('Content-Length')
          setWeight(contentLength ? Number.parseInt(contentLength, 10) : null)
        }
      }
      xhr.send()
    }
  }, [imageUrl])

  return weight
}

// I use
// function MyComponent() {
//     const imageUrl = 'https://example.com/image.jpg';
//     const weight = useImageWeight(imageUrl);

//     return (
//       <div>
//         <img src={imageUrl} alt="My Image" />
//         {weight ? `Peso de imagen: ${weight} bytes` : 'Cargando...'}
//       </div>
//     );
//   }

// const weightInMB = weight / (1024 * 1024);

// function MyComponent() {
//     const imageUrl = 'https://example.com/image.jpg';
//     const weight = useImageWeight(imageUrl);

//     return (
//       <div>
//         <img src={imageUrl} alt="My Image" />
//         {weight ? `Peso de imagen: ${(weight / (1024 * 1024)).toFixed(2)} MB` : 'Cargando...'}
//       </div>
//     );
//   }
