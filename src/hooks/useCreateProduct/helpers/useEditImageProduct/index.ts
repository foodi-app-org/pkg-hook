 
import { useRef, useState } from 'react'

type PreviewImg = { src: string; alt: string }
type UseEditImageProductProps = {
  sendNotification?: (args: { backgroundColor?: string; title: string; description: string }) => void
  initialState: PreviewImg
}

/**
 *
 * @param image
 * @param crop
 * @param crop.x
 * @param crop.y
 * @param zoom
 * @returns {{x: number, y: number, width: number, height: number}}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getPixelCrop(
  image: HTMLImageElement,
  crop: { x: number; y: number },
  zoom: number
) {
  const imgWidth = image.naturalWidth
  const imgHeight = image.naturalHeight

  const scaledWidth = imgWidth * zoom
  const scaledHeight = imgHeight * zoom

  const x = (imgWidth * crop.x) / 100
  const y = (imgHeight * crop.y) / 100

  return {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight
  }
}

export const useEditImageProduct = ({
  sendNotification = () => {},
  initialState
}: UseEditImageProductProps) => {
  const [openEditImage, setOpenEditImage] = useState(false)
  const [{ src, alt }, setPreviewImg] = useState<PreviewImg>(initialState)
  const [existImage, setExistImage] = useState(false)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom] = useState<number>(0)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const handleOpenEditImage = () => {
    setOpenEditImage(!openEditImage)
  }

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onCropComplete = (
    crop: { x: number; y: number },
    pixelCrop: { x: number; y: number; width: number; height: number }
  ) => {
    const canvas = document.createElement('canvas')
    const img = imageRef.current

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    const ctx = canvas.getContext('2d')
    if (ctx && img) {
      ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )
      const croppedUrl = canvas.toDataURL()
      fetch(croppedUrl)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], 'cropped_image.jpg', { type: blob.type })
          setPreviewImg(
            file
              ? {
                  src: URL.createObjectURL(file),
                  alt: ''
                }
              : initialState
          )
          sendNotification({
            backgroundColor: 'success',
            title: 'Éxito',
            description: 'Imagen editada'
          })
          setExistImage(true)
          handleOpenEditImage()
        })
        .catch(() => {
          sendNotification({
            backgroundColor: 'error',
            title: 'Error',
            description: 'Ha ocurrido un error!'
          })
        })
    }
  }

  const handleEditImage = () => {
    handleOpenEditImage()
  }

  return {
    img: null,
    crop,
    existImage,
    zoom,
    alt, 
    src,
    imageRef,
    openEditImage,
    handleEditImage,
    onCropChange,
    onCropComplete
  }
}
