import { useRef, useState } from 'react'
import { ORIENTATION_TO_ANGLE } from './helper'
import { getCroppedImg, getRotatedImage } from './helper/canvasUtils'
import { getOrientation } from './helper/getOrientation'

function readFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => resolve(reader.result), false)
        reader.readAsDataURL(file)
    })
}

type SendNotificationFn = (params: {
    description: string
    title: string
    backgroundColor: string
}) => void

interface UseImageUploaderOptions {
    validTypes?: string[]
    maxSizeMB?: number
    minWidth?: number
    minHeight?: number
    sendNotification: SendNotificationFn
}

interface UseImageUploaderResult {
    inputRef: React.RefObject<HTMLInputElement>
    open: boolean
    imageSrc: string | null
    preview: string | null
    croppedImage: string | null
    crop: { x: number, y: number }
    zoom: number
    rotation: number
    error: string
    image: File
    onCropComplete: (croppedArea: any, croppedPixels: any) => void
    showCroppedImage: () => Promise<void>
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
    handleClose: () => void
    setCrop: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>
    setZoom: React.Dispatch<React.SetStateAction<number>>
    setRotation: React.Dispatch<React.SetStateAction<number>>
    reset: () => void
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
        validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'],
        maxSizeMB = 20,
        minWidth = 300,
        minHeight = 275,
        sendNotification
    } = options || {}

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
            const base64Image = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)

            setCroppedImage(base64Image)
            setPreview(base64Image)

            // ✅ Convert base64 to blob and file
            const blob = await (await fetch(base64Image)).blob()
            const file = new File([blob], image?.name || 'cropped.jpeg', { type: blob.type })
            setImage(file)
        } catch (e) {
            console.error('❌ Failed to crop image:', e)
        }
    }

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        setError('')
        setPreview(null)
        setImageSrc(null)
        if (!file) return

        if (!validTypes.includes(file.type)) {
            const error = 'Formato inválido. Usa JPEG, JPG, PNG o HEIC.'
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
            const orientation = await getOrientation(file)
            const rotation = ORIENTATION_TO_ANGLE[orientation]
            if (rotation) {
                imageDataUrl = await getRotatedImage(imageDataUrl, rotation)
                setRotation(rotation)
            }
        } catch (e) {
            return sendNotification({
                description: 'Error',
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

    const reset = () => {
        setImageSrc(null)
        setCroppedImage(null)
        setPreview(null)
        setError('')
        setZoom(1)
        setCrop({ x: 0, y: 0 })
        setRotation(0)
        if (inputRef.current) inputRef.current.value = ''
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
        onCropComplete,
        showCroppedImage,
        onFileChange,
        handleClose,
        setCrop,
        setZoom,
        setRotation,
        reset
    }
}
