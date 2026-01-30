import { useRef, useState } from 'react'

import { ORIENTATION_TO_ANGLE } from './helper'
import { getCroppedImg, getRotatedImage } from './helper/canvasUtils'
import { getOrientation } from './helper/getOrientation'

/**
 *
 * @param file
 */
function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {return resolve(reader.result as string)}, false)
    reader.readAsDataURL(file)
  })
}

export type SendNotificationFn = (params: {
    description: string
    title: string
    backgroundColor: string
}) => void

interface UseImageUploaderOptions {
    maxSizeMB?: number
    minHeight?: number
    minWidth?: number
    validTypes?: string[]
    sendNotification: SendNotificationFn
}

interface UseImageUploaderResult {
    crop: { x: number, y: number }
    croppedImage: string | null
    error: string
    image: File
    imageSrc: string | null
    inputRef: React.RefObject<HTMLInputElement>
    loading: boolean
    open: boolean
    preview: string | null
    formattedList: string
    rotation: number
    zoom: number
    validTypes: string[]
    handleClose: () => void
    handleRemoveImage: () => void
    onCropComplete: (croppedArea: any, croppedPixels: any) => void
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    setCrop: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>
    setRotation: React.Dispatch<React.SetStateAction<number>>
    setZoom: React.Dispatch<React.SetStateAction<number>>
    handleDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>
    showCroppedImage: () => Promise<void>
}

/**
 * Hook for managing image selection, preview, validation and cropping
 * @param {UseImageUploaderOptions} options
 * @returns {UseImageUploaderResult}
 */
export const useImageUploaderProduct = (
  options?: UseImageUploaderOptions
): UseImageUploaderResult => {
  const {
    validTypes = ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB = 20,
    minWidth = 300,
    minHeight = 275,
    sendNotification
  } = options ?? {

  }
  const readableFormats = validTypes
    .map((type) => {return type.split('/')[1].toUpperCase()})

  const formatter = new Intl.ListFormat('es', {
    style: 'long',
    type: 'conjunction'
  })

  const formattedList = formatter.format(readableFormats)

  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [error, setError] = useState('')
  const [image, setImage] = useState<File | null>(null)


  const onCropComplete = (_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const showCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    try {
      setLoading(true)
      const base64Image = await getCroppedImg(imageSrc, croppedAreaPixels, rotation) as string

      setCroppedImage(base64Image)
      setPreview(base64Image)

      // ✅ Convert base64 to blob and file
      const blob = await (await fetch(base64Image)).blob()
      const file = new File([blob], image?.name ?? 'cropped.jpeg', { type: blob.type })
      setImage(file)
      setLoading(false)
    } catch (e) {
      setLoading(false)
      return sendNotification({
        description: e ?? 'Ocurrió un error',
        title: 'Error',
        backgroundColor: 'error'
      })
    }
  }

  /**
   * Removes the selected image and resets relevant states
   */
  const handleRemoveImage = () => {
    setImage(null)
    setPreview(null)
    setImageSrc(null)
    setCroppedImage(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setRotation(0)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    handleRemoveImage()
    if (!file) return

    if (!validTypes.includes(file.type)) {


      const error = `Formato inválido. Solo se permiten: ${formattedList}.`
      sendNotification({
        description: error,
        title: 'Error',
        backgroundColor: 'error'
      })
      return setError(error)
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `El archivo supera los ${maxSizeMB} MB.`
      sendNotification({
        description: error,
        title: 'Error',
        backgroundColor: 'error'
      })
      return setError(`El archivo supera los ${maxSizeMB} MB.`)
    }

    let imageDataUrl = await readFile(file)

    try {
      const orientation = await getOrientation(file, validTypes)
      const rotation = ORIENTATION_TO_ANGLE[orientation]
      if (rotation) {
        imageDataUrl = await getRotatedImage(imageDataUrl, rotation) as string
        setRotation(rotation)
      }
    } catch (e) {
      return sendNotification({
        description: 'Error desconocido',
        title: 'Error',
        backgroundColor: 'error'
      })
    }

    const image = new Image()
    image.src = imageDataUrl
    image.onload = () => {
      if (image.width < minWidth || image.height < minHeight) {
        const error = `Resolución mínima: ${minWidth}x${minHeight}px.`
        sendNotification({
          description: error,
          title: 'Error',
          backgroundColor: 'error'
        })
        setError(error)
        return
      }
      setImageSrc(imageDataUrl)
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(!open)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    handleRemoveImage()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    if (!validTypes.includes(file.type)) {
      const error = `Formato inválido. Solo se permiten: ${formattedList}.`
      sendNotification({
        description: error,
        title: 'Error',
        backgroundColor: 'error'
      })
      return setError(error)
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `El archivo supera los ${maxSizeMB} MB.`
      sendNotification({
        description: error,
        title: 'Error',
        backgroundColor: 'error'
      })
      return setError(error)
    }

    let imageDataUrl = await readFile(file)

    try {
      const orientation = await getOrientation(file, validTypes)
      const rotation = ORIENTATION_TO_ANGLE[orientation]
      if (rotation) {
        imageDataUrl = await getRotatedImage(imageDataUrl, rotation) as string
        setRotation(rotation)
      }
    } catch (e) {
      return sendNotification({
        description: 'Error al procesar la orientación de la imagen',
        title: 'Error',
        backgroundColor: 'error'
      })
    }

    const image = new Image()
    image.src = imageDataUrl
    image.onload = () => {
      if (image.width < minWidth || image.height < minHeight) {
        const error = `Resolución mínima: ${minWidth}x${minHeight}px.`
        sendNotification({
          description: error,
          title: 'Error',
          backgroundColor: 'error'
        })
        setError(error)
        return
      }
      setImageSrc(imageDataUrl)
      setImage(file)
      setOpen(true)
    }
  }


  return {
    inputRef,
    open,
    imageSrc,
    preview,
    croppedImage,
    crop,
    zoom,
    image,
    rotation,
    error,
    formattedList,
    loading,
    validTypes,
    onCropComplete,
    showCroppedImage,
    handleRemoveImage,
    handleDrop,
    onFileChange,
    handleClose,
    setCrop,
    setZoom,
    setRotation
  }
}
