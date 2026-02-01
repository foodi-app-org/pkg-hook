import { useState } from 'react'
import { Product } from 'typesdefs'
import * as XLSX from 'xlsx'

import { RandomCode } from '../../utils'

import { validateProductDataExcel } from './helpers/validateProductDataExcel'

const STEPS = {
  UPLOAD_FILE: 0,
  UPLOAD_PRODUCTS: 1
}

type PrecioAlPublico = number | null | string;

export interface ProductUpload  extends Product {
  CANTIDAD: number
  ORIGINAL_CANTIDAD: number
  free: boolean
  product: string
  pCode: string
  editing: boolean
  PRECIO_AL_PUBLICO: PrecioAlPublico
  ProImage: string
  VALOR_DE_COMPRA: number
  manageStock: boolean
  errors: string[] | null
  oldPrice?: number // changed from number | undefined to just number | undefined (default for optional)
  NOMBRE?: string
  [key: string]: unknown
}

interface UseUploadProductsProps {
  sendNotification?: (notification: {
    title: string
    description: string
    backgroundColor: 'success' | 'error' | 'info' | 'warning'
  }) => void
}
export const useUploadProducts = ({
  sendNotification = () => { return null }
}: UseUploadProductsProps) => {
  const [data, setData] = useState<ProductUpload[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [active, setActive] = useState(STEPS.UPLOAD_FILE)
  const [overActive, setOverActive] = useState(STEPS.UPLOAD_FILE)

  const handleOverActive = (index: number) => {
    setOverActive(index)
  }
  const readExcelFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const data = new Uint8Array(buffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet)
      return json
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to read file as ArrayBuffer.')
    }
  }

  const onChangeFiles = async (files: FileList) => {
    setIsLoading(true) // Activa el loader al inicio
    try {
      const filePromises = Array.from(files).map(file => {return readExcelFile(file)})
      const newData = await Promise.all(filePromises)

      const newProducts = newData.flat().map((product, index) => {
        // Assert product as a record to access its properties
        const prod = product as Partial<ProductUpload>
        const rawPrecio = prod.PRECIO_AL_PUBLICO
        const PRECIO_AL_PUBLICO: string | number | null =
          rawPrecio === undefined || rawPrecio === null || Number.isNaN(Number(rawPrecio))
            ? 0
            : rawPrecio

        const rawValorCompra = prod.VALOR_DE_COMPRA
        const VALOR_DE_COMPRA: number =
          rawValorCompra === undefined || rawValorCompra === null || Number.isNaN(Number(rawValorCompra))
            ? 0
            : Number(rawValorCompra)

        // Ensure CANTIDAD is always a number
        const safeCantidad = Number.isNaN(Number(prod.CANTIDAD)) || prod.CANTIDAD === undefined ? 1 : Number(prod.CANTIDAD)

        const code = RandomCode(9)
        // Use "DESCRIPCIÓN" if your Excel uses the accented version, otherwise keep "DESCRIPCION"
        const description = (prod.DESCRIPCIÓN ?? prod.DESCRIPCION) as string

        // Construct a valid ProductUpload object before validation
        const productUpload: ProductUpload = {
          ...(prod as Product),
          CANTIDAD: safeCantidad,
          ORIGINAL_CANTIDAD: safeCantidad,
          free: false,
          product: description,
          pCode: code,
          editing: false,
          PRECIO_AL_PUBLICO,
          ProImage: '/images/placeholder-image.webp',
          VALOR_DE_COMPRA,
          manageStock: true,
          errors: null
        }

        const validationErrors = validateProductDataExcel(productUpload, index)

        // Attach errors after validation
        productUpload.errors = validationErrors.length > 0 ? validationErrors : null

        return productUpload
      })

      // Notificación de errores
      newProducts.forEach(product => {
        if (product.errors) {
          // Enviar una notificación por cada error encontrado
          product.errors.forEach((error: string) => {
            sendNotification({
              description: error,
              title: 'Error',
              backgroundColor: 'error'
            })
          })
        }
      })

      // Validar el número total de productos antes de actualizar el estado
      setData(prevData => {
        const currentLength = prevData.length
        const totalProducts = currentLength + newProducts.length

        if (totalProducts > 100) {
          sendNotification({
            description: 'Cannot add more products. You have reached the 100-product limit.',
            title: 'Error',
            backgroundColor: 'error'
          })

          // Calcular la cantidad de productos que se pueden agregar sin exceder el límite
          const remainingSlots = 100 - currentLength
          const productsToAdd = newProducts.slice(0, remainingSlots)
          return [...prevData, ...productsToAdd]
        } 
        // Agregar todos los nuevos productos si no se excede el límite
        return [...prevData, ...newProducts]
        
      })
    } catch (error) {
      if (error instanceof Error) {
        sendNotification({
          description: error.message,
          title: 'Error',
          backgroundColor: 'error'
        })
        return
      }
      sendNotification({
        description: 'Un error ha ocurrido mientras se cargaba el archivo de productos.',
        title: 'Error',
        backgroundColor: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetActive = (index: number) => {
    if (typeof index !== 'number' || index < 0 || index >= Object.keys(STEPS).length) {
      sendNotification({
        description: 'Invalid step index',
        title: 'Error',
        backgroundColor: 'error'
      })
      return
    }
    if (active === STEPS.UPLOAD_FILE) {
      setActive(data.length ? STEPS.UPLOAD_PRODUCTS : 0)
    }
  }

  const updateProductQuantity = (index: number, quantityChange: number) => {
    // Validar el índice
    if (index < 0 || index >= data.length) {
      console.warn('Invalid product index:', index)
      return
    }

    const newData = [...data]
    const newQuantity = newData[index].CANTIDAD + quantityChange

    // Actualizar la cantidad solo si es mayor o igual a 0
    if (newQuantity < 0) {
      console.warn('Quantity cannot be negative, no update performed.')
      return // No permitir cantidades negativas
    }

    // Actualizar la cantidad
    newData[index].CANTIDAD = newQuantity
    newData[index].ORIGINAL_CANTIDAD = newQuantity
    // Eliminar el producto si la nueva cantidad es 0
    if (newData[index].CANTIDAD === 0) {
      newData.splice(index, 1)

      // Verificar si no quedan más productos
      if (newData.length === 0) {
        setActive(STEPS.UPLOAD_FILE) // Restablecer el estado activo a 0 si no hay productos
      }
    }

    setData(newData)
  }
  /**
   * Toggle the 'free' status of a specific product in the data array.
   * Performs validation to ensure the product index is valid.
   *
   * @param {number} productIndex - The index of the product to update.
   */
  const handleCheckFree = (productIndex: number) => {
    setData((prevData: ProductUpload[]) => {
    // Validar que el índice es un número válido
      if (typeof productIndex !== 'number' || productIndex < 0 || productIndex >= prevData.length) {
        console.warn('Invalid product index:', productIndex)
        return prevData // Retorna el estado anterior si el índice es inválido
      }

      // Validar que el producto existe y que tiene la propiedad 'free'
      const product = prevData[productIndex]
      if (!product || product.free === undefined) {
        console.warn('Product or "free" property not found for index:', productIndex)
        return prevData // Retorna el estado anterior si no se encuentra el producto
      }

      // Evitar cambios innecesarios si el estado de 'free' no cambia
      const updatedFreeStatus = !product.free
      if (product.free === updatedFreeStatus) {
        // Only warn or error are allowed
        console.warn('Product "free" status is already:', updatedFreeStatus)
        return prevData // No actualiza si el estado es el mismo
      }

      // Extract nested ternary for clarity and type safety
      let restoredPrice: number | undefined = undefined
      if (!updatedFreeStatus) {
        restoredPrice = typeof product.oldPrice === 'number' ? product.oldPrice : undefined
      }

      // Crear una nueva copia de los datos actualizando solo el producto específico
      return prevData.map((product, index) => {
        let precioAlPublicoValue: number | string | null;
        if (updatedFreeStatus) {
          precioAlPublicoValue = 0;
        } else if (typeof restoredPrice === 'number') {
          precioAlPublicoValue = restoredPrice;
        } else {
          precioAlPublicoValue = product.PRECIO_AL_PUBLICO ?? 0;
        }
        return index === productIndex
          ? {
              ...product,
              free: updatedFreeStatus,
              PRECIO_AL_PUBLICO: precioAlPublicoValue,
              oldPrice: typeof product.PRECIO_AL_PUBLICO === 'number' ? product.PRECIO_AL_PUBLICO : undefined
            }
          : product;
      })
    })
  }
  const handleCleanAllProducts = () => {
    setData([])
    setActive(STEPS.UPLOAD_FILE)
  }
  /**
   * Toggle the 'editing' status of a specific product in the data array.
   * Validates the product index and only updates if necessary.
   *
   * @param {number} productIndex - The index of the product to update.
   */
  const handleToggleEditingStatus = (productIndex: number) => {
    setData((prevData) => {
    // Validar que el índice es un número válido
      if (typeof productIndex !== 'number' || productIndex < 0 || productIndex >= prevData.length) {
        sendNotification({
          description: `Invalid product index: ${productIndex}`,
          title: 'Error',
          backgroundColor: 'error'
        })
        return prevData // Retorna el estado anterior si el índice es inválido
      }

      // Validar que el producto existe y tiene la propiedad 'editing'
      const product = prevData[productIndex]
      if (!product || product.editing === undefined) {
        sendNotification({
          description: `Product or "editing" property not found for index: ${productIndex}`,
          title: 'Error',
          backgroundColor: 'error'
        })
        return prevData // Retorna el estado anterior si no se encuentra el producto
      }

      // Evitar cambios innecesarios si el estado de 'editing' no cambia
      const updatedEditingStatus = !product.editing
      if (product.editing === updatedEditingStatus) {
        sendNotification({
          description: `Product "editing" status is already: ${updatedEditingStatus}`,
          title: 'Info',
          backgroundColor: 'info'
        })
        return prevData // No actualiza si el estado es el mismo
      }

      // Crear una nueva copia de los datos actualizando solo el producto específico
      return prevData.map((product, index) => {
        return index === productIndex
          ? {
            ...product,
            editing: updatedEditingStatus
          }
          : product
      }
      )
    })
  }

  /**
   * Confirm and update the quantity of a product in the data array.
   * Only updates when the button is clicked.
   *
   * @param {number} productIndex - The index of the product to update.
   */
  const handleSuccessUpdateQuantity = (productIndex: number) => {
    const product = data[productIndex]
    setData((prevData) => {
      // Validar que `CANTIDAD` sea un número entero
      const product = prevData[productIndex]
      if (!Number.isInteger(product?.CANTIDAD)) {
        sendNotification({
          description: 'La cantidad debe ser un valor entero.',
          title: 'Error',
          backgroundColor: 'error'
        })
        return prevData // Retorna el estado anterior si `CANTIDAD` no es entero
      }

      // Crear una copia actualizada de prevData donde se actualiza `CANTIDAD` si es necesario
      const updatedData = prevData.map((product, index) =>
      {return index === productIndex
        ? { ...product, editing: false, ORIGINAL_CANTIDAD: product.CANTIDAD } // Actualización o cambio de estado
        : product}
      )

      // Filtrar productos con CANTIDAD mayor a 0
      const filteredData = updatedData.filter(product => {return product.CANTIDAD > 0})

      // Cambiar el estado a `STEPS.UPLOAD_FILE` si no quedan productos
      if (filteredData.length === 0) {
        setActive(STEPS.UPLOAD_FILE)
      }

      return filteredData
    })
    if (product.CANTIDAD !== data[productIndex].ORIGINAL_CANTIDAD) {
      sendNotification({
        description: `Cantidad actualizada con éxito para el producto ${product.NOMBRE} #${productIndex}.`,
        title: 'Éxito',
        backgroundColor: 'success'
      })
    }
  }

  const handleChangeQuantity = (event: React.ChangeEvent<HTMLInputElement>, productIndex: number) => {
    const { value } = event.target
    const parsedQuantity = Number(value)
    setData((prevData: ProductUpload[]) => {
      if (typeof productIndex !== 'number' || productIndex < 0 || productIndex >= prevData.length) {
        console.warn('Invalid product index:', productIndex)
        return prevData // Retorna el estado anterior si el índice es inválido
      }

      // Validar que la cantidad sea un número válido y no negativo
      if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
        console.warn('Quantity must be a valid non-negative number.')
        return prevData // Retorna sin cambios si la cantidad no es válida
      }

      // Actualiza el array `data` con la nueva cantidad (como número)
      return prevData.map((product, index) =>
        index === productIndex
          ? { ...product, CANTIDAD: parsedQuantity }
          : product
      )
    })
  }
  /**
   * Restore the 'CANTIDAD' value to 'ORIGINAL_CANTIDAD' for a specific product.
   * Validates the product index and only updates if necessary.
   *
   * @param {number} productIndex - The index of the product to restore quantity for.
   */
  const handleCancelUpdateQuantity = (productIndex: number) => {
    setData((prevData: ProductUpload[]) => {
    // Validar que el índice es un número válido
      if (typeof productIndex !== 'number' || productIndex < 0 || productIndex >= prevData.length) {
        console.warn('Invalid product index:', productIndex)
        return prevData // Retorna el estado anterior si el índice es inválido
      }

      // Validar que el producto existe y tiene las propiedades 'CANTIDAD' y 'ORIGINAL_CANTIDAD'
      const product = prevData[productIndex]
      if (!product || product.ORIGINAL_CANTIDAD === undefined) {
        console.warn('Product or "ORIGINAL_CANTIDAD" property not found for index:', productIndex)
        return prevData // Retorna el estado anterior si no se encuentra el producto o propiedad
      }

      // Crear una nueva copia de los datos actualizando solo el producto específico
      return prevData.map((product, index) =>
      {return index === productIndex
        ? { ...product, CANTIDAD: product.ORIGINAL_CANTIDAD, editing: false }
        : product}
      )
    })
  }
  /**
   * Filters products with a quantity of 0 or less from the data array.
   * Sends a notification if any products are found with invalid quantities.
   */
  const filterInvalidQuantityProducts = () => {
    setData((prevData) => {
    // Filtrar productos con `CANTIDAD` mayor a 0
      const validProducts = prevData.filter(product => {return product.CANTIDAD > 0})

      // Notificar si hubo productos con cantidad no válida
      if (validProducts.length < prevData.length) {
        sendNotification({
          description: 'Some products had a quantity of 0 or less and were removed.',
          title: 'Invalid Products Removed',
          backgroundColor: 'warning'
        })
      }

      return validProducts
    })
  }

  /**
   * Compares uploaded products against response data to determine which were successfully uploaded.
   */
  type UploadResponse = {
    success: boolean
    data: { pCode: string }
  }
  
  const getUploadResults = (
    data: ProductUpload[],
    response: UploadResponse[]
  ): { successfullyUploaded: ProductUpload[]; failedUploads: ProductUpload[] } => {
    const uploadedCodes = new Set(
      response
        .filter((product: UploadResponse) => { return product.success })
        .map((product: UploadResponse) => { return product.data.pCode })
    )
  
    const successfullyUploaded = data.filter((product: ProductUpload) =>
      uploadedCodes.has(product.pCode)
    )
  
    const failedUploads = data.filter(
      (product: ProductUpload) => { return !uploadedCodes.has(product.pCode) }
    )
  
    return {
      successfullyUploaded,
      failedUploads
    }
  }
  return {
    active,
    STEPS,
    isLoading,
    data,
    overActive,
    handleOverActive,
    handleCheckFree,
    getUploadResults,
    onChangeFiles,
    handleChangeQuantity,
    handleCancelUpdateQuantity,
    handleToggleEditingStatus,
    filterInvalidQuantityProducts,
    handleSuccessUpdateQuantity,
    updateProductQuantity,
    handleCleanAllProducts,
    setActive: handleSetActive
  }
}
