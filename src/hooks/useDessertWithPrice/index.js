import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef
} from 'react'
import { useUpdateMultipleExtProductFoods } from '../useUpdateMultipleExtProductFoods'
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

  const [updateMultipleExtProductFoods, { loading }] = useUpdateMultipleExtProductFoods({ handleCleanLines: () => { return } })
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
  const handleRemove = async (i, exPid) => {
    try {
      if (exPid) {
        const findDataExtra = dataExtra?.find(x => { return x?.exPid === exPid })
        if (findDataExtra) {
          const data = await deleteExtraProductFoods({
            variables: {
              state: 1,
              id: exPid
            },
            update: (cache) => {
              cache.modify({
                fields: {
                  ExtProductFoodsAll: (dataOld = []) => {
                    const { success } = data?.data?.deleteextraproductfoods || {}
                    if (success && Array.isArray(dataOld)) {
                      const transformedData = transformData(dataOld)
                      const Lines = transformedData.filter((_, index) => { return index !== i })
                      const newCache = dataOld.filter((_, index) => { return index !== i })
                      setLine({ ...LineItems, Lines })
                      return newCache
                    }
                  }
                }
              })
            }
          })
        }
      }
      if (!exPid) {
        return filterOneLine(i)
      }
    } catch (error) {
      sendNotification({
        title: 'error',
        description: 'Ocurrió un error',
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

  /**
 * Convierte un string con números y puntos en un número entero.
 * @param {string} str - El string a convertir.
 * @returns {number} El número entero resultante.
 */
  function stringToInt (str) {
    try {
      // Verifica si el string es válido
      if (!str || typeof str !== 'string') {
        throw new Error('Input must be a valid string.')
      }

      // Elimina los puntos y convierte a número
      const num = parseInt(str.replace(/\./g, ''), 10)

      // Verifica si el resultado es un número válido
      if (isNaN(num)) {
        throw new Error('The string must contain only numbers and dots.')
      }

      return num
    } catch (_error) {
      return 0
    }
  }
  const handleEdit = async (i, exPid) => {
    setSelected({ exPid: null, loading: true })
    const findOneExtra = LineItems?.Lines?.find((x, i) => { return x?.exPid === exPid })
    const { extraName, extraPrice: price } = findOneExtra || {}
    const extraPrice = stringToInt(price)
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
    try {
      const checkNumberRange = findNumbersExceedingRange(LineItems?.Lines)
      updateErrorFieldByIndex({ checkNumberRange, setLine })
      if (checkNumberRange?.length > 0) {
        return setAlertBox({ message: 'El precio no puede ser tan alto', duration: 10000 })
      }

      if (!prepareAndValidateData(pId)) return
      const dataArr = LineItems?.Lines?.map(x => {
        const extraPrice = stringToInt(x.extraPrice)
        const extraName = x.extraName
        return {
          extraPrice,
          exState: x.exState === true ? 1 : 0,
          extraName,
          pId
        }
      })
      const filteredItems = filterItemsWithValidExPid(LineItems?.Lines, pId)

      return updateMultipleExtProductFoods({
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
