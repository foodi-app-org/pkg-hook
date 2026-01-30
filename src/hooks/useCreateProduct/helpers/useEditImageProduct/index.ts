 
import { useRef, useState } from 'react'

export const useEditImageProduct = ({ sendNotification = () => { }, initialState }) => {
  const [openEditImage, setopenEditImage] = useState(false)
   
  const [tags, setTags] = useState([])
  const [{ src, alt }, setPreviewImg] = useState([])
  const [errors, setErrors] = useState({})
  const handleOpenEditImage = () => {
    setopenEditImage(!openEditImage)
  }
  // eslint-disable-next-line
  const changeHandler = (name, value) => {
    if (name === 'tags') {
      setTags(value)
      if (value.length > 0 && errors.tags) {
        setErrors(prev => {
          const prevErrors = { ...prev }
          delete prevErrors.tags
          return prevErrors
        })
      }
    }
  }
  const [existImage, setExistImage] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0)
  const imageRef = useRef(null)
  const onCropChange = (crop) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom) => {
    setZoom(zoom)
  }

  const onCropComplete = (crop, pixelCrop) => {
    const canvas = document.createElement('canvas')
    const img = imageRef.current

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    const ctx = canvas.getContext('2d')
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0, 0,
      pixelCrop.width,
      pixelCrop.height)
    // ctx.drawImage(
    //   img,
    //   pixelCrop.x,
    //   pixelCrop.y,
    //   pixelCrop.width,
    //   pixelCrop.height,
    //   0,
    //   0,
    //   canvas.width,
    //   canvas.height
    // )
    const croppedUrl = canvas.toDataURL()
    // console.log(croppedUrl)
    // You can use the croppedUrl for whatever you want
    // for example, you can set it as the src of an img element
    // or send it to a server
    // Convert the dataURL to a blob
    fetch(croppedUrl)
      .then(response => { return response.blob() })
      .then(blob => {
        // Create a new File
        const file = new File([blob], 'cropped_image.jpg', { type: blob.type })
        setPreviewImg(
          file
            ? {
              src: URL.createObjectURL(file),
              alt: ''
            }
            : initialState
        )
        // You can use the file object to send it to a server or to download it
        sendNotification({
          backgroundColor: 'success',
          title: 'Exito',
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
    // You can use the file object to send it to a server or to download it
  }
  /**
   *
   * @param image
   * @param crop
   * @param zoom
   */
  function getPixelCrop (image, crop, zoom) {
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
  const handleEditImage = () => {
    handleOpenEditImage()
  }

  const [Dimage, setImage] = useState('')
  const [cropData, setCropData] = useState('#')
  const [cropper, setCropper] = useState()
  const onChange = (e) => {
    e.preventDefault()
    let files
    if (e.dataTransfer) {
      files = e.dataTransfer.files
    } else if (e.target) {
      files = e.target.files
    }
    const reader = new FileReader()
    reader.onload = () => {
      setImage(reader.result)
    }
    reader.readAsDataURL(files[0])
  }

  const getCropData = () => {
    if (typeof cropper !== 'undefined') {
      setCropData(cropper.getCroppedCanvas().toDataURL())
      fetch(cropper)
        .then(response => { return response.blob() })
        .then(blob => {
          // Create a new File
          const file = new File([blob], 'cropped_image.jpg', { type: blob.type })
          setPreviewImg(
            file
              ? {
                src: URL.createObjectURL(file),
                alt: ''
              }
              : initialState
          )
          // You can use the file object to send it to a server or to download it
          sendNotification({ title: 'Exito', description: 'Imagen editada' })
          setExistImage(true)
          handleOpenEditImage()
        })
        .catch(() => {
          sendNotification({ title: 'Error', description: 'Ha ocurrido un error!' })
        })
    }
  }
  return {
    img: null,
    crop,
    existImage,
    zoom,
    handleEditImage,
    onCropChange
  }
}
