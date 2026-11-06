import { useMutation } from '@apollo/client'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef
} from 'react'


import { useDeleteExtraProductFoods } from '../useDeleteExtraProductFoods'
import { useUpdateMultipleExtProduct } from '../useUpdateMultipleExtProduct'

import {
  findNumbersExceedingRange,
  markEmptyRequiredFields,
  transformData,
  updateErrorFieldByIndex
} from './helpers'
import { EDIT_EXTRA_PRODUCT_FOODS } from './queries'

import type {
  AlertBoxType,
  SendNotificationFn,
  SetAlertBoxFn
} from 'typesdefs'

interface UseDessertWithPriceProps {
  dataExtra?: Array<any>
  sendNotification?: SendNotificationFn
  setAlertBox?: SetAlertBoxFn
}

/**
 * Shape of a single complement (extra) line in the editor state.
 */
interface ExtraLine {
  exPid?: string | number | null
  extraName?: string
  extraPrice?: number | string
  exState?: boolean
  forEdit?: boolean
  manageStock?: boolean
  stock?: number
  error?: boolean
  errorName?: boolean
  errorPrice?: boolean
  messageError?: string
  [key: string]: any
}

/**
 * Determines whether a line already exists in the database.
 *
 * `exPid` is the identifier used throughout this hook to distinguish
 * persisted extras from rows that only exist in the local editor state.
 * Numeric IDs (including 0) are treated as valid identifiers.
 * @param line
 */
const hasPersistedExPid = (line?: ExtraLine | null): boolean => {
  const exPid = line?.exPid

  return (
    exPid !== undefined &&
    exPid !== null &&
    String(exPid).trim() !== ''
  )
}

export const useDessertWithPrice = ({
  dataExtra = [],
  sendNotification = ({
    title,
    description,
    backgroundColor
  }) => {
    return {
      title,
      description,
      backgroundColor
    }
  },
  setAlertBox
}: UseDessertWithPriceProps = {}) => {
  const [selected, setSelected] = useState({
    loading: false,
    exPid: null
  })
  const [editExtraProductFoods] = useMutation(EDIT_EXTRA_PRODUCT_FOODS)

  const initialLine = useMemo<ExtraLine>(() => {
    return {
      extraName: '',
      extraPrice: '',
      exState: false,
      manageStock: false,
      stock: 1
    }
  }, [])

  const initialLineItems = useMemo<{ Lines: ExtraLine[] }>(() => {
    return {
      Lines: [
        {
          extraName: '',
          extraPrice: '',
          exState: false,
          manageStock: false,
          stock: 1
        },
        (initialLine)
      ]
    }
  }, [initialLine])
  const transformedData = transformData(dataExtra)

  const [LineItems, setLine] = useState<{ Lines: ExtraLine[] }>(
    Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems
  )

  const inputRefs = useRef(LineItems.Lines.map(() => { return createRef() }))

  const handleSelect = (item: any, index: number): undefined => {
    try {
      const { exPid } = item || {}
      setSelected({ exPid, loading: false })
      if (inputRefs?.current[index]) {
        (inputRefs.current[index].current as HTMLInputElement | null)?.focus()
      }
      return undefined
    } catch (error) {
      if (error instanceof Error) {
        sendNotification({
          title: error.message,
          description: 'Error',
          backgroundColor: 'error'
        })
      }
      return undefined
    }
  }

  useEffect(() => {
    // Asegurándote de que las referencias se actualicen si LineItems cambia
    inputRefs.current = LineItems.Lines.map((_: unknown, i: number) => { return inputRefs.current[i] || createRef() })
  }, [LineItems])

  /**
   * Removes only local rows that have not been persisted yet.
   *
   * Use the latest state instead of rebuilding the list from `dataExtra`:
   * that prop can be stale inside a callback, and rebuilding from it can
   * discard database records or overwrite the current values of saved rows.
   */
  const handleCleanLines = useCallback((): void => {
    setLine((currentLineItems) => {
      const currentLines = Array.isArray(currentLineItems?.Lines)
        ? currentLineItems.Lines
        : []

      const persistedLines = currentLines.filter(hasPersistedExPid)

      return {
        ...currentLineItems,
        // Keep every saved row. If none remain, preserve the existing
        // initial UI behavior by restoring the two empty starter rows.
        Lines: persistedLines.length > 0
          ? persistedLines
          : initialLineItems.Lines.map((line) => ({ ...line }))
      }
    })
  }, [initialLineItems])

  const [updateMultipleExtProduct, { loading }] = useUpdateMultipleExtProduct({
    handleCleanLines: () => { },
    sendNotification
  })
  /**
   * Handles the addition of two new lines to the Lines array in LineItems state.
   */
  const handleAdd = useCallback(() => {
    try {
      // Ensure that LineItems and initialLine are not null or undefined
      if (!LineItems || !initialLine) {
        throw new Error('Han ocurrido un error.')
      }

      // Ensure that LineItems.Lines is an array
      if (!Array.isArray(LineItems.Lines)) {
        throw new TypeError('Han ocurrido un error.')
      }

      // Clone the existing Lines array and add two new objects (clones of initialLine) to it
      const Lines = [...LineItems.Lines, { ...initialLine }]

      // Update the LineItems state with the new Lines array
      setLine((prevLineItems) => { return { ...prevLineItems, Lines } })
    } catch (error) {
      if (error instanceof Error) {
        sendNotification({
          title: error.message,
          description: 'Error',
          backgroundColor: 'error'
        })
      }
    }
  }, [LineItems, initialLine, setLine])

  const handleFocusChange = (index: number): void => {
    const lastItem = LineItems.Lines.length - 1
    if (lastItem === index) {
      handleAdd()
    }
  }

  /**
   * Handles changes in line items, updating the state accordingly.
   * @param {number} index - The index of the line item being updated.
   * @param {string} name - The name of the attribute being changed.
   * @param {any} value - The new value of the attribute.
   */
  const handleLineChange = (index: number, name: string, value: any): void => {
    const newLines = LineItems.Lines.map((line: any, i: number) => {
      if (i !== index) return { ...line }

      const newLine = { ...line }

      if (name === 'extraName' || name === 'extraPrice') {
        newLine[name] = value

        // Limpia el estado de requerido del campo en cuanto el usuario escribe,
        // para que el resaltado de error desaparezca al corregirlo.
        const filled = String(value ?? '').trim() !== ''

        if (name === 'extraName') newLine.errorName = !filled
        if (name === 'extraPrice') newLine.errorPrice = !filled

        if (!newLine.errorName && !newLine.errorPrice) {
          newLine.error = false
          newLine.messageError = ''
        }
      } else if (name === 'exState') {
        newLine[name] = value.target.checked
      } else {
        newLine[name] = value
      }

      return newLine
    })

    setLine({ ...LineItems, Lines: newLines })
  }
  const { deleteExtraProductFoods } = useDeleteExtraProductFoods()

  /**
   * Filter out a specific line from the LineItems array.
   * @param {number} index - Index of the line to be filtered out.
   * @returns {void}
   */
  const filterOneLine = (index: number): void => {
    // Use optional chaining to safely access nested properties.
    const Lines = LineItems?.Lines?.filter((_: unknown, i: number) => i !== index)
    // Use spread operator to create a new object with the filtered Lines array.
    return setLine({ ...LineItems, Lines })
  }

  /**
   * Removes a product extra by index or external product ID.
   *
   * @param dataOld
   * @param {number} i - Index of the item in the list.
   * @param {string} [exPid] - External product ID to remove (optional).
   * @returns {Promise<void>}
   */
  /**
   * Removes a line from the local editor state by its exPid. This is the source
   * of truth the modal renders, so it must run regardless of the Apollo cache.
   * @param exPid
   */
  const removeLineByExPid = (exPid: string | number): void => {
    setLine(prev => {
      const Lines = (prev?.Lines ?? []).filter(line => line?.exPid !== exPid)
      return { ...prev, Lines }
    })
  }

  /**
   * Drops the deleted extra from the persisted `ExtProductFoodsAll` cache field
   * by exPid, so other views that read the query stay in sync.
   * @param dataOld
   * @param exPid
   */
  function removeFromCacheByExPid(dataOld: any[], exPid: string | number) {
    if (!Array.isArray(dataOld)) return dataOld

    return dataOld.filter((item: any) => {
      const ref = item?.exPid ?? item?.__ref
      return ref !== exPid && item?.exPid !== exPid
    })
  }

  const handleRemove = async (i: number, exPid?: string): Promise<void> => {
    // Lines without an exPid only exist on the client, so remove them locally.
    if (!exPid) {
      filterOneLine(i)
      return
    }

    // Ignore repeated clicks on the row that is already being deleted.
    if (selected.loading && selected.exPid === exPid) return
    setSelected({ exPid, loading: true })

    try {
      const { data } = await deleteExtraProductFoods({
        variables: {
          state: 1,
          id: exPid
        },
        update: (cache: any) => {
          // Keep the shared query cache in sync. This only runs if the field
          // exists, so it is a best-effort sync, not the source of truth.
          cache.modify({
            fields: {
              ExtProductFoodsAll: (dataOld: any[] = []) => removeFromCacheByExPid(dataOld, exPid)
            }
          })
        }
      })

      const res = data?.deleteExtraProduct
      const success = res?.success
      const message = res?.message || ''

      if (!success) {
        sendNotification({
          title: 'Error',
          description: message || 'No se pudo eliminar el complemento',
          backgroundColor: 'error'
        })
        return
      }

      // Source of truth: remove from the editor list the modal renders.
      removeLineByExPid(exPid)

      sendNotification({
        title: 'Producto eliminado',
        description: message,
        backgroundColor: 'success'
      })
      return
    } catch (error) {
      sendNotification({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al eliminar el producto',
        backgroundColor: 'error'
      })
      return
    } finally {
      // Always clear the deleting flag so the row's buttons re-enable, whether
      // the mutation succeeded, failed, or threw.
      setSelected({ exPid: null, loading: false })
    }
  }

  useEffect(() => {
    setLine(Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems)
  }, [dataExtra.length])

  const prepareAndValidateData = useCallback((pId: string) => {
      const dataArr = LineItems?.Lines?.map((line: any) => {
        const { extraPrice, exState, extraName, manageStock, stock } = line
        return {
          extraPrice: Number(extraPrice),
          exState: exState === true ? 1 : 0,
          extraName,
          manageStock: Boolean(manageStock),
          stock: manageStock ? (Number(stock) || 1) : 0,
          pId
        }
      })
      const message = 'Complete los campos vacíos'
      const findInputEmpty = dataArr?.find((item: any) => { return item.extraName === '' })
      const findInputEmptyPrice = dataArr?.find((item: any) => {
        return Number.isNaN(Number(item.extraPrice)) || String(item.extraPrice).trim() === ''
      })
  
      if (findInputEmpty || findInputEmptyPrice) {
        setAlertBox?.({ message, type: AlertBoxType.WARNING })
        return null
      }
      return dataArr
    }, [LineItems])

  const handleEdit = async (i: number, exPid: string) => {
    // Mark THIS row as saving (keep it selected so its inline editor stays open
    // and only its button shows the saving state). Using exPid here—rather than
    // null—prevents every other row's Edit button from being disabled.
    setSelected({ exPid, loading: true })
    try {
      const findOneExtra = LineItems?.Lines?.find(x => { return x?.exPid === exPid })
      const { extraName, extraPrice: price, manageStock, stock } = findOneExtra || {}
      const extraPrice = price
      const { data } = await editExtraProductFoods({
        variables: {
          exPid,
          extraName,
          extraPrice,
          manageStock: Boolean(manageStock),
          stock: manageStock ? (Number(stock) || 1) : 0
        },
        update: (cache) => {
          cache.modify({
            fields: {
              ExtProductFoodsAll: () => {
                return LineItems?.Lines || []
              }
            }
          })
        }
      })
      if (!data?.editExtraProductFoods?.success) {
        sendNotification({
          title: 'Error',
          description: data?.editExtraProductFoods?.message || '',
          backgroundColor: 'error'
        })
        return null
      }

      sendNotification({
        title: 'Producto actualizado',
        description: data?.editExtraProductFoods?.message || '',
        backgroundColor: 'success'
      })
      return null
    } catch (error) {
      sendNotification({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el complemento',
        backgroundColor: 'error'
      })
      return null
    } finally {
      // Always clear the saving/selected state so the Edit buttons re-enable
      // and the row returns to read-only. This fixes the bug where buttons
      // stayed disabled after editing an item.
      setSelected({ exPid: null, loading: false })
    }
  }

  /**
   *
   * @param items
   * @param pId
   * @returns Array of filtered and transformed items
   */
  function filterItemsWithValidExPid(items: ExtraLine[], pId: string) {
    // Primero, filtrar los elementos basados en exPid
    const filteredItems = items.filter(({ exPid }) => {
      const isExPidValid = !exPid
      return isExPidValid
    })

    // Luego, transformar los elementos filtrados
    return filteredItems.map(({ exPid, extraPrice, exState, extraName, manageStock, stock }) => {
      return {
        exPid,
        extraPrice,
        exState: exState === true ? 1 : 0,
        extraName,
        manageStock: Boolean(manageStock),
        stock: manageStock ? (Number(stock) || 1) : 0,
        pId
      }
    })
  }

  const handleSubmit = ({ pId }: { pId: string }): Promise<void> => {
    try {
      // Marca como requeridas las líneas con nombre o precio vacío y avisa.
      const invalidIndexes = markEmptyRequiredFields(setLine)
      if (invalidIndexes.length > 0) {
        sendNotification({
          title: 'Campos obligatorios',
          description: 'Completa el nombre y el precio de cada complemento antes de guardar.',
          backgroundColor: 'warning'
        })
        setAlertBox?.({ message: 'Completa los campos obligatorios', type: AlertBoxType.WARNING })
        return Promise.resolve()
      }

      const checkNumberRange = findNumbersExceedingRange(LineItems?.Lines)
      updateErrorFieldByIndex({ checkNumberRange, setLine })
      if (checkNumberRange?.length > 0) {
        sendNotification({
          title: 'Precio inválido',
          description: 'El precio no puede ser tan alto.',
          backgroundColor: 'warning'
        })
        setAlertBox?.({ message: 'El precio no puede ser tan alto', type: AlertBoxType.WARNING })
        return Promise.resolve()
      }

      if (!prepareAndValidateData(pId)) {
        sendNotification({
          title: 'Campos obligatorios',
          description: 'Completa los campos vacíos antes de guardar.',
          backgroundColor: 'warning'
        })
        return Promise.resolve()
      }
      const dataArr = LineItems?.Lines?.map((x: any) => {
        const extraPrice = Number(x.extraPrice)
        const extraName = x.extraName
        return {
          extraPrice,
          exState: x.exState === true ? 1 : 0,
          extraName,
          manageStock: Boolean(x.manageStock),
          stock: x.manageStock ? (Number(x.stock) || 1) : 0,
          pId
        }
      })
      const filteredItems = filterItemsWithValidExPid(LineItems?.Lines, pId)

      return updateMultipleExtProduct({
        variables: {
          inputLineItems: {
            setData: filteredItems
          }
        },
        update: (cache: any) => {
          cache.modify({
            fields: {
              ExtProductFoodsAll: () => {
                return dataArr
              }
            }
          })
        }
      })
    } catch (error) {
      if (error instanceof Error) setAlertBox?.({ message: `${error.message}`, type: AlertBoxType.ERROR })
      return Promise.resolve()
    }
  }
  const isLoading = loading

  return {
    initialLine,
    inputRefs,
    selected,
    loading: isLoading,
    initialLineItems,
    LineItems,
    handleCleanLines,
    handleLineChange,
    handleSelect,
    handleFocusChange,
    setLine,
    handleEdit,
    handleRemove,
    handleAdd,
    handleSubmit
  }
}
