import {
  useState,
  useEffect,
  useMemo
} from 'react'
import { MockData } from '../../mock'
import { RandomCode, updateCacheMod } from '../../utils'
import { useUpdateExtProductFoodsOptional } from '../updateExtProductFoodsOptional'
import { useUpdateExtProductFoodsSubOptional } from '../useUpdateExtProductFoodsSubOptional'
import { useRemoveExtraProductFoodsOptional } from '../useRemoveExtraProductFoodsOptional'
import { GET_EXTRAS_PRODUCT_FOOD_OPTIONAL } from '../useRemoveExtraProductFoodsOptional/queries'
import { transformDataToDessert } from './helpers'
import { useDeleteSubProductOptional } from '../useDeleteSubProductOptional'

export const useDessert = ({
  pId = null,
  initialData = null,
  sendNotification = () => { }
}) => {
  // Initialize state variables using the useState hook
  const [setCheck, setChecker] = useState({}) // State for checkboxes
  const [valueItems, setValueItems] = useState('') // State for input values
  const [title, setTitle] = useState('') // State for title input value

  // Initialize the data state with the transformedData or MockData
  const [data, setData] = useState(MockData)
  const dataListIds = data?.listIds?.filter(x => x !== '01list')

  /**
 * Checks if all required lists have the maximum number of cards.
 *
 * @return {boolean} Returns true if all required lists have the maximum number of cards, otherwise false.
 */
  const isCompleteRequired = dataListIds?.every(listID => {
    try {
      if (!Array.isArray(dataListIds) || data === null) {
        throw new Error('Invalid arguments. dataListIds must be an array and data must be a non-null object.')
      }
      const list = data.lists[listID]
      // If list or list.cards is missing, assume the list is not complete
      const verifiEmpyRequireCard = list?.cards?.length
      if (list && list?.cards) {
        return verifiEmpyRequireCard === list.numberLimit
      }

      // If list or list.cards is missing, assume the list is not complete
      return false
    } catch (e) {
      return false
    }
  })

  // Transform initialData using useMemo to prevent unnecessary re-computation
  const transformedData = useMemo(() => transformDataToDessert(initialData), [initialData])

  // Use useEffect to update the data state when the initialData prop changes
  useEffect(() => {
    if (initialData) {
      setData(transformedData)
    }
  }, [])

  // Filter the 'listIds' from 'data' and store the filtered result in 'dataListIds'
  // Here, it seems to exclude a specific list ID ('01list') from the listIds.

  //  HOOKS
  const { handleMutateExtProductFoodsSubOptional } = useUpdateExtProductFoodsSubOptional()
  const { handleUpdateExtProduct } = useUpdateExtProductFoodsOptional()
  const { DeleteExtProductFoodsOptional } = useRemoveExtraProductFoodsOptional()
  const [DeleteExtFoodSubsOptional] = useDeleteSubProductOptional()

  // HANDLESS
  /**
   * Handles checkbox changes and updates the setCheck state accordingly.
   * @param {Event} e - The checkbox change event object.
   */
  const handleCheck = (e) => {
    // Extract the 'name' and 'checked' properties from the event target (checkbox)
    const { name, checked } = e.target

    // Update the setCheck state with the new value for the checkbox identified by the 'name' property
    setChecker({ ...setCheck, [name]: checked })
  }

  /**
  * Handles the removal of a list from the data state and performs additional operations if needed.
  * @param {number} i - The index of the list to be removed.
  * @param {string} listID - The ID of the list to be removed (optional).
  * @throws {Error} Will throw an error if the provided index (i) is not a non-negative number.
  * @throws {Error} Will throw an error if the provided index (i) is out of range.
  * @throws {Error} Will throw an error if the provided listID is invalid (optional validation).
  */
  const handleRemoveList = (i, listID) => {
    // Validate that the provided index (i) is a non-negative number
    if (typeof i !== 'number' || i < 0) {
      throw new Error('Invalid index provided. The index must be a non-negative number.')
    }

    // Make a copy of the listIds array from the data state
    const listIdsCopy = [...data.listIds]

    // Validate that the provided index (i) is within the range of the listIds array
    if (i >= listIdsCopy.length) {
      throw new Error('Invalid index provided. The index is out of range.')
    }

    // Remove the list with the specified index from the listIdsCopy array
    const Lines = data?.listIds.filter((_, index) => index !== i)?.filter(x => x !== '01list')
    // Update the data state with the modified listIdsCopy array
    setData({
      listIds: listID ? Lines.filter((subItem) => { return subItem !== listID }) : Lines,
      lists: {
        ...data.lists
      }
    })

    // Perform additional operations if a valid listID is provided
    if (listID) {
      try {
        // Assuming DeleteExtProductFoodsOptional is a function that deletes an external product
        // Call the function to delete the external product using the provided listID
        DeleteExtProductFoodsOptional({
          variables: {
            state: 1,
            opExPid: listID,
            isCustomOpExPid: true
          },
          update: (cache, { data: { ExtProductFoodsOptionalAll } }) => {
            return updateCacheMod({
              cache,
              query: GET_EXTRAS_PRODUCT_FOOD_OPTIONAL,
              nameFun: 'ExtProductFoodsOptionalAll',
              dataNew: ExtProductFoodsOptionalAll
            })
          }
        })
      } catch (error) {
        // Handle any errors that may occur during the deletion process
        throw new Error('An error occurred while deleting the external product.')
      }
    }
  }

  /**
   * Removes a specific item from a list within the data state.
   * @param {Object} params - The parameters for removing the item.
   * @param {string} params.listID - The ID of the list from which the item will be removed.
   * @param {string} params.id - The ID of the item to be removed.
   * @throws {Error} Will throw an error if the provided listID does not exist in the data state.
   * @throws {Error} Will throw an error if the provided listID exists but the corresponding list does not have a cards array.
   */
  const removeOneItem = ({
    listID = '',
    id = '',
    isCustomSubOpExPid = false
  }) => {
    try {
      const forRemove = Boolean(isCustomSubOpExPid && listID && id)
      if (forRemove) {
        DeleteExtFoodSubsOptional({
          variables: {
            isCustomSubOpExPid,
            opSubExPid: listID,
            state: 1
          }
        })
      }
      // Ensure the provided listID exists in the data state
      if (!data.lists[listID]) {
        throw new Error(`List with ID "${listID}" does not exist.`)
      }

      // Ensure the list has a cards array
      if (!Array.isArray(data.lists[listID].cards)) {
        throw new Error(`List with ID "${listID}" does not have a valid cards array.`)
      }

      // Get the current list from the data state using the provided listID
      const currentList = data.lists[listID]

      // Filter out the item with the specified ID from the current list's cards array
      const totalCart = currentList.cards.filter((cart) => cart.id !== id)

      // Update the current list's cards with the filtered array to remove the specified item
      setData({
        listIds: [...data.listIds],
        lists: {
          ...data.lists,
          [listID]: {
            ...currentList,
            cards: totalCart
          }
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  const addCard = async (title, listId) => {
    const id = RandomCode(9)
    const newCard = {
      id,
      title,
      numberLimit: 5,
      value: '',
      required: setCheck.exState ? 1 : 0
    }
    const list = data.lists[listId]
    list.cards = [...list.cards, newCard]
    setData({
      ...data,
      lists: {
        ...data.lists,
        [listId]: list
      }
    })
    handleMutateExtProductFoodsSubOptional({
      pId,
      title,
      listId,
      id,
      state: 1
    })
    setTitle('')
  }
  const handleAdd = ({ listId }) => {
    if (valueItems !== '' && valueItems.trim() !== '') {
      addCard(valueItems, listId)
    }
    setValueItems('')
  }

  /**
   * Handles the addition of a new list with the given title and number limit.
   * @param {Object} params - The parameters for adding the new list.
   * @param {string} params.title - The title of the new list.
   * @param {number} params.numberLimit - The number limit for the new list.
   */
  const handleAddList = async ({ title, numberLimit }) => {
    // Check if the title is not empty
    if (title.trim() === '') {
      sendNotification({
        description: 'El titulo no debe estar vacio',
        title: 'Error',
        backgroundColor: 'warning'
      })
    }

    // Generate a new list ID using the RandomCode function (must be implemented elsewhere)
    const newListId = RandomCode(9)

    // Determine if the list is required based on the setCheck.exState state
    const required = setCheck.exState ? 1 : 0

    // Add the new list to the data state
    setData({
      listIds: [...data.listIds, newListId],
      lists: {
        ...data.lists,
        [newListId]: {
          id: newListId,
          title,
          required,
          numberLimit,
          value: '',
          cards: []
        }
      }
    })

    // Update the external product with the information of the new list
    handleUpdateExtProduct({
      pId,
      code: newListId,
      OptionalProName: title,
      required,
      numbersOptionalOnly: numberLimit
    })

    // Clear the title field after adding the list
    setTitle('')
  }

  /**
  * Handles the change of items in a specific list.
  * @param {Object} params - The parameters for handling the change.
  * @param {string} params.listID - The ID of the list where the change is happening.
  * @param {Object} params.value - The event object containing the new value for the list items.
  */
  const handleChangeItems = ({ listID, value: e }) => {
    const value = e.target.value
    setValueItems(value)

    // Get the current list from the data state using the provided listID
    const currentList = data.lists[listID]

    // Update the value of the current list with the new value
    setData({
      listIds: [...data.listIds],
      lists: {
        ...data.lists,
        [listID]: {
          ...currentList,
          value
        }
      }
    })

    // Note: The return statement seems to be unnecessary, and the map function doesn't serve a purpose here.
    // If you want to map through dataListIds for some other reason, you should use it separately from this function.
  }

  return {
    addCard,
    data,
    dataListIds,
    isCompleteRequired,
    handleAdd,
    handleAddList,
    handleChangeItems,
    handleCheck,
    handleRemoveList,
    removeOneItem,
    setCheck,
    setData,
    setTitle,
    title
  }
}
