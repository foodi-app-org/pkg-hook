import { useMutation } from '@apollo/client'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef
} from 'react'
import {
  AlertBoxType,
  SendNotificationFn,
  SetAlertBoxFn
} from 'typesdefs'

import { useDeleteExtraProductFoods } from '../useDeleteExtraProductFoods'
import { useUpdateMultipleExtProduct } from '../useUpdateMultipleExtProduct'

import {
  findNumbersExceedingRange,
  transformData,
  updateErrorFieldByIndex
} from './helpers'
import { EDIT_EXTRA_PRODUCT_FOODS } from './queries'

interface UseDessertWithPriceProps {
  dataExtra?: Array<any>
  sendNotification?: SendNotificationFn
  setAlertBox?: SetAlertBoxFn
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

  const initialLine = useMemo(() => {
    return {
      extraName: '',
      extraPrice: '',
      exState: false
    }
  }, [])

  const initialLineItems = useMemo(() => {
    return {
      Lines: [
        {
          extraName: '',
          extraPrice: '',
          exState: false
        },
        (initialLine)
      ]
    }
  }, [initialLine])
  const transformedData = transformData(dataExtra)

  const [LineItems, setLine] = useState(
    Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems
  )

  const inputRefs = useRef(LineItems.Lines.map(() => { return createRef() }))

  const handleSelect = (item: any, index: number): undefined => {
    try {
      const { exPid } = item || {}
      setSelected({ exPid, loading: false })
      if (inputRefs?.current[index]) {
        inputRefs.current[index].current.focus()
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

  const handleCleanLines = useCallback(() => {
    setLine(Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems)
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
  // Helper function to handle cache modification logic
  function handleCacheModification(dataOld: any[], i: number) {
    if (!Array.isArray(dataOld)) return dataOld

    const transformedData = transformData(dataOld)
    const Lines = transformedData.filter((_item: any, index: number) => index !== i)
    const newCache = dataOld.filter((_item: any, index: number) => index !== i)

    setLine(prev => ({
      ...prev,
      Lines
    }))

    return newCache
  }

  const handleRemove = async (i: number, exPid?: string): Promise<void> => {
    try {
      if (!exPid) {
        filterOneLine(i)
        return
      }

      const findDataExtra = dataExtra?.find(x => x?.exPid === exPid)
      if (!findDataExtra) return

      await deleteExtraProductFoods({
        variables: {
          state: 1,
          id: exPid
        },
        update: (cache: any, result: { data?: any }) => {
          const res = result.data?.deleteExtraProduct
          const success = res?.success
          const message = res?.message || ''

          if (!success) {
            sendNotification({
              title: 'Error',
              description: message,
              backgroundColor: 'error'
            })
            return null
          }

          sendNotification({
            title: 'Producto eliminado',
            description: message,
            backgroundColor: 'success'
          })

          cache.modify({
            fields: {
              ExtProductFoodsAll: (dataOld: any[] = []) => handleCacheModification(dataOld, i)
            }
          })
          return null
        }
      })
      return
    } catch (error) {
      if (error instanceof Error) {
        sendNotification({
          title: error.message,
          description: 'Ocurrió un error al eliminar el producto',
          backgroundColor: 'error'
        })
      }
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error al eliminar el producto',
        backgroundColor: 'error'
      })
      return
    }
  }

  useEffect(() => {
    setLine(Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems)
  }, [dataExtra.length])

  const prepareAndValidateData = useCallback((pId: string) => {
    const dataArr = LineItems?.Lines?.map(({ extraPrice, exState, extraName }: { extraPrice: number; exState: boolean; extraName: string }) => {
      return {
        extraPrice,
        exState: exState === true ? 1 : 0,
        extraName,
        pId
      }
    })
    const message = 'Complete los campos vacíos'
    const findInputEmpty = dataArr?.find(({ extraName }: { extraName: string }) => { return extraName === '' })
    const findInputEmptyPrice = dataArr?.find(({ extraPrice }: { extraPrice: number }) => {
      return isNaN(Number(extraPrice)) || String(extraPrice).trim() === ''
    })

    if (findInputEmpty || findInputEmptyPrice) {
      setAlertBox?.({ message, type: AlertBoxType.WARNING })
      return null
    }
    return dataArr
  }, [LineItems])

  const handleEdit = async (i: number, exPid: string) => {
    setSelected({ exPid: null, loading: true })
    const findOneExtra = LineItems?.Lines?.find((x: { exPid: string }) => { return x?.exPid === exPid })
    const { extraName, extraPrice: price } = findOneExtra || {}
    const extraPrice = price
    const { data } = await editExtraProductFoods({
      variables: {
        exPid,
        extraName,
        extraPrice
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

    if (data?.editExtraProductFoods?.success) {
      sendNotification({
        title: 'Producto actualizado',
        description: data?.editExtraProductFoods?.message || '',
        backgroundColor: 'success'
      })
      return null
    }
    return null
  }

  /**
   *
   * @param items
   * @param pId
   * @returns Array of filtered and transformed items
   */
  function filterItemsWithValidExPid(items: Array<{ exPid: string; extraPrice: number; exState: boolean; extraName: string }>, pId: string) {
    // Primero, filtrar los elementos basados en exPid
    const filteredItems = items.filter(({ exPid }) => {
      const isExPidValid = !exPid
      return isExPidValid
    })

    // Luego, transformar los elementos filtrados
    return filteredItems.map(({ exPid, extraPrice, exState, extraName }) => {
      return {
        exPid,
        extraPrice,
        exState: exState === true ? 1 : 0,
        extraName,
        pId
      }
    })
  }

  const handleSubmit = ({ pId }: { pId: string }): Promise<void> => {
    try {
      const checkNumberRange = findNumbersExceedingRange(LineItems?.Lines)
      updateErrorFieldByIndex({ checkNumberRange, setLine })
      if (checkNumberRange?.length > 0) {
        setAlertBox?.({ message: 'El precio no puede ser tan alto', type: AlertBoxType.WARNING })
        return Promise.resolve()
      }

      if (!prepareAndValidateData(pId)) return Promise.resolve()
      const dataArr = LineItems?.Lines?.map((x: { extraPrice: number; extraName: string; exState: boolean }) => {
        const extraPrice = x.extraPrice
        const extraName = x.extraName
        return {
          extraPrice,
          exState: x.exState === true ? 1 : 0,
          extraName,
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
