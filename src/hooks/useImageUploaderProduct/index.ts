import { useRef, useState } from 'react'

import { ORIENTATION_TO_ANGLE } from './helper'
import { getCroppedImg, getRotatedImage } from './helper/canvasUtils'
import { getOrientation } from './helper/getOrientation'

/**
 * Read a File as data URL.
 * @param file - File to read.
 * @returns Promise resolving to data URL string.
 */
const readFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener(
      'load',
      () => {
        const result = reader.result
        if (typeof result === 'string') resolve(result)
        else reject(new Error('Unable to read file as data URL'))
      },
      false
    )
    reader.addEventListener('error', () => reject(new Error('File read error')), false)
    reader.readAsDataURL(file)
  })

export type SendNotificationFn = (params: {
  description: string
  title: string
  backgroundColor: string
}) => void

export interface UseImageUploaderOptions {
  maxSizeMB?: number
  minHeight?: number
  minWidth?: number
  validTypes?: string[]
  sendNotification?: SendNotificationFn
}

export interface UseImageUploaderResult {
  crop: { x: number; y: number }
  croppedImage: string | null
  error: string | null
  image: File | null
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
  onCropComplete: (croppedArea: unknown, croppedPixels: unknown) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  setCrop: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  setRotation: React.Dispatch<React.SetStateAction<number>>
  setZoom: React.Dispatch<React.SetStateAction<number>>
  handleDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>
  showCroppedImage: () => Promise<void>
}

/**
 * Hook for image upload + preview + validate + crop.
 *
 * - Validates type and size
 * - Reads EXIF orientation and rotates image if needed
 * - Provides cropping flow via getCroppedImg/getRotatedImage (from canvasUtils)
 *
 * @param options - configuration for uploader
 * @returns API described in UseImageUploaderResult
 */
export const useImageUploaderProduct = (
  options?: UseImageUploaderOptions
): UseImageUploaderResult => {
  const {
    validTypes = ['image/jpeg', 'image/jpg', 'image/png'],
    maxSizeMB = 20,
    minWidth = 300,
    minHeight = 275,
    sendNotification = () => {}
  } = options ?? {}

  const readableFormats = validTypes.map((t) => t.split('/')[1].toUpperCase())
  const formatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' })
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
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [image, setImage] = useState<File | null>(null)

  const clearAll = (): void => {
    setImage(null)
    setPreview(null)
    setImageSrc(null)
    setCroppedImage(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setRotation(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemoveImage = (): void => {
    clearAll()
  }

  const notifyError = (msg: string): void => {
    setError(msg)
    try {
      sendNotification({
        description: msg,
        title: 'Error',
        backgroundColor: 'error'
      })
    } catch {
      // swallow notification errors to avoid breaking flow
    }
  }

  const validateFile = (file: File): string | null => {
    if (!validTypes.includes(file.type)) {
      return `Formato inválido. Solo se permiten: ${formattedList}.`
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `El archivo supera los ${maxSizeMB} MB.`
    }
    return null
  }

  const processLoadedImage = async (file: File, imageDataUrl: string) => {
    try {
      const orientation = await getOrientation(file, validTypes)
      const rot = ORIENTATION_TO_ANGLE[orientation as keyof typeof ORIENTATION_TO_ANGLE]
      if (rot) {
        const rotated = (await getRotatedImage(imageDataUrl, rot)) as string
        setRotation(rot)
        setImageSrc(rotated)
      } else {
        setImageSrc(imageDataUrl)
      }
      setImage(file)
      setOpen(true)
    } catch (err) {
      if (err instanceof Error && err.message === 'Invalid image data') {
        notifyError('No se pudo leer la orientación de la imagen.')
        return
      }
        // If orientation fails due to invalid image, notify
      // If orientation fails, still attempt to use the image; validate dimensions
      const img = new Image()
      img.src = imageDataUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          if (img.width < minWidth || img.height < minHeight) {
            reject(new Error(`Resolución mínima: ${minWidth}x${minHeight}px.`))
          } else resolve()
        }
        img.onerror = () => reject(new Error('Invalid image data'))
      })
      // If successful, set image
      setImageSrc(imageDataUrl)
      setImage(file)
      setOpen(true)

    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0] ?? null
    clearAll()
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      notifyError(validationError)
      return
    }

    setLoading(true)
    try {
      const imageDataUrl = await readFile(file)
      await processLoadedImage(file, imageDataUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error while reading file'
      notifyError(msg)
    } finally {
      setLoading(false)
    }
  }

  const onCropComplete = (_croppedArea: unknown, croppedPixels: unknown): void => {
    setCroppedAreaPixels(croppedPixels)
  }

  const showCroppedImage = async (): Promise<void> => {
    if (!imageSrc || !croppedAreaPixels) {
      notifyError('No image or crop area available.')
      return
    }

    try {
      setLoading(true)
      const base64Image = (await getCroppedImg(imageSrc, croppedAreaPixels, rotation)) as string
      setCroppedImage(base64Image)
      setPreview(base64Image)

      // Convert base64 to blob and file
      const blob = await (await fetch(base64Image)).blob()
      const file = new File([blob], image?.name ?? 'cropped.jpeg', { type: blob.type })
      setImage(file)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error while cropping image'
      notifyError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (): void => {
    setOpen(false)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    clearAll()
    const file = event.dataTransfer.files?.[0] ?? null
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      notifyError(validationError)
      return
    }

    setLoading(true)
    try {
      const imageDataUrl = await readFile(file)
      try {
        const orientation = await getOrientation(file, validTypes)
        const rot = ORIENTATION_TO_ANGLE[orientation as keyof typeof ORIENTATION_TO_ANGLE]
        if (rot) {
          const rotated = (await getRotatedImage(imageDataUrl, rot)) as string
          setRotation(rot)
          setImageSrc(rotated)
        } else {
          setImageSrc(imageDataUrl)
        }
        setImage(file)
        setOpen(true)
      } catch {
        // fallback: validate dims and set
        const img = new Image()
        img.src = imageDataUrl
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (img.width < minWidth || img.height < minHeight) {
              reject(new Error(`Resolución mínima: ${minWidth}x${minHeight}px.`))
            } else resolve()
          }
          img.onerror = () => reject(new Error('Invalid image data'))
        })
        setImageSrc(imageDataUrl)
        setImage(file)
        setOpen(true)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error processing dropped file'
      notifyError(msg)
    } finally {
      setLoading(false)
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
