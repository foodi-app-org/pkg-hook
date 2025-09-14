import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef
} from 'react'
import { useUpdateMultipleExtProduct } from '../useUpdateMultipleExtProduct'
import { useMutation } from '@apollo/client'
import { EDIT_EXTRA_PRODUCT_FOODS } from './queries'
import { findNumbersExceedingRange, transformData, updateErrorFieldByIndex } from './helpers'
import { useDeleteExtraProductFoods } from '../useDeleteExtraProductFoods'

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
  setAlertBox = ({ message, duration = 10000, success = true }) => { return { message, duration, success } }
} = {}) => {
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

  const inputRefs = useRef(LineItems.Lines.map(() => createRef()))

  const handleSelect = (item, index) => {
    try {
      const { exPid } = item || {}
      setSelected({ exPid, loading: false })
      if (inputRefs?.current[index]) {
        inputRefs.current[index].current.focus()
      }
    } catch (error) {
      return null
    }
  }

  useEffect(() => {
    // Asegurándote de que las referencias se actualicen si LineItems cambia
    inputRefs.current = LineItems.Lines.map((_, i) => inputRefs.current[i] || createRef())
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
        throw new Error('Han ocurrido un error.')
      }

      // Clone the existing Lines array and add two new objects (clones of initialLine) to it
      const Lines = [...LineItems.Lines, { ...initialLine }]

      // Update the LineItems state with the new Lines array
      setLine((prevLineItems) => { return { ...prevLineItems, Lines } })
    } catch (error) {
      sendNotification({
        title: error.message,
        description: 'Error',
        backgroundColor: 'error'
      })
    }
  }, [LineItems, initialLine, setLine])

  const handleFocusChange = (index) => {
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
  const handleLineChange = (index, name, value) => {
    const newLines = LineItems.Lines.map((line, i) => {
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
 */
  const filterOneLine = (index) => {
    // Use optional chaining to safely access nested properties.
    const Lines = LineItems?.Lines?.filter((_, i) => { return i !== index })
    // Use spread operator to create a new object with the filtered Lines array.
    return setLine({ ...LineItems, Lines })
  }

  /**
   * Removes a product extra by index or external product ID.
   *
   * @param {number} i - Index of the item in the list.
   * @param {string} [exPid] - External product ID to remove (optional).
   * @returns {Promise<void>}
   */
  const handleRemove = async (i, exPid) => {
    try {
      if (!exPid) {
        return filterOneLine(i)
      }

      const findDataExtra = dataExtra?.find(x => x?.exPid === exPid)
      if (!findDataExtra) return

      await deleteExtraProductFoods({
        variables: {
          state: 1,
          id: exPid
        },
        update: (cache, { data }) => {
          const res = data?.deleteextraproductfoods
          const success = res?.success
          const message = res?.message || ''

          if (!success) {
            return sendNotification({
              title: 'Error',
              description: message,
              backgroundColor: 'error'
            })
          }

          sendNotification({
            title: 'Producto eliminado',
            description: message,
            backgroundColor: 'success'
          })

          cache.modify({
            fields: {
              ExtProductFoodsAll: (dataOld = []) => {
                if (!Array.isArray(dataOld)) return dataOld

                const transformedData = transformData(dataOld)
                const Lines = transformedData.filter((_, index) => index !== i)
                const newCache = dataOld.filter((_, index) => index !== i)

                setLine(prev => ({
                  ...prev,
                  Lines
                }))

                return newCache
              }
            }
          })
        }
      })
    } catch (error) {
      console.log('🚀 ~ handleRemove ~ error:', error)
      sendNotification({
        title: 'Error',
        description: 'Ocurrió un error al eliminar el producto',
        backgroundColor: 'error'
      })
    }
  }

  useEffect(() => {
    setLine(Array.isArray(dataExtra) && dataExtra.length > 0 ? { Lines: transformedData } : initialLineItems)
  }, [dataExtra.length])

  const prepareAndValidateData = useCallback((pId) => {
    const dataArr = LineItems?.Lines?.map(({ extraPrice, exState, extraName }) => ({
      extraPrice,
      exState: exState === true ? 1 : 0,
      extraName,
      pId
    }))
    console.log(dataArr)
    const message = 'Complete los campos vacíos'
    const findInputEmpty = dataArr?.find(({ extraName }) => extraName === '')
    const findInputEmptyPrice = dataArr?.find(({ extraPrice }) => isNaN(extraPrice) || extraPrice === '')

    if (findInputEmpty || findInputEmptyPrice) {
      setAlertBox({ message })
      return null
    }
    return dataArr
  }, [LineItems])

  const handleEdit = async (i, exPid) => {
    setSelected({ exPid: null, loading: true })
    const findOneExtra = LineItems?.Lines?.find((x, i) => { return x?.exPid === exPid })
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
      return sendNotification({
        title: 'Error',
        description: data?.editExtraProductFoods?.message || '',
        backgroundColor: 'error'
      })
    }

    if (data?.editExtraProductFoods?.success) {
      return sendNotification({
        title: 'Producto actualizado',
        description: data?.editExtraProductFoods?.message || '',
        backgroundColor: 'success'
      })
    }
  }

  function filterItemsWithValidExPid (items, pId) {
    // Primero, filtrar los elementos basados en exPid
    const filteredItems = items.filter(({ exPid }) => {
      const isExPidValid = !exPid
      return isExPidValid
    })

    // Luego, transformar los elementos filtrados
    return filteredItems.map(({ exPid, extraPrice, exState, extraName }) => ({
      exPid,
      extraPrice,
      exState: exState === true ? 1 : 0,
      extraName,
      pId
    }))
  }

  const handleSubmit = ({ pId }) => {
    console.log('🚀 ~ handleSubmit ~ pId:', pId)
    try {
      const checkNumberRange = findNumbersExceedingRange(LineItems?.Lines)
      updateErrorFieldByIndex({ checkNumberRange, setLine })
      if (checkNumberRange?.length > 0) {
        return setAlertBox({ message: 'El precio no puede ser tan alto', duration: 10000 })
      }

      if (!prepareAndValidateData(pId)) return
      const dataArr = LineItems?.Lines?.map(x => {
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
        update: (cache) => {
          cache.modify({
            fields: {
              ExtProductFoodsAll: () => {
                return dataArr
              }
            }
          })
        }
      }).then((res) => {
        setAlertBox({ message: 'Se ha creado correctamente', duration: 7000, success: true })
      })
    } catch (error) {
      setAlertBox({ message: `${error}`, duration: 7000 })
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
