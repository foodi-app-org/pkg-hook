import { useState } from 'react'
import { MockData } from '../../mock'
import { RandomCode } from '../../utils'
import { useUpdateExtProductFoodsOptional } from '../updateExtProductFoodsOptional'
import { useUpdateExtProductFoodsSubOptional } from '../useUpdateExtProductFoodsSubOptional'

export const useDessert = ({ pId }) => {
    // STATES
  const [setCheck, setChecker] = useState({})
  const [valueItems, setValueItems] = useState('')
  const [title, setTitle] = useState('')
  const [data, setData] = useState(MockData)
  const dataListIds = data?.listIds?.filter(x => { return x !== '01list' })
    //  HOOKS
    const { handleMutateExtProductFoodsSubOptional } = useUpdateExtProductFoodsSubOptional()
    const { handleUpdateExtProduct } = useUpdateExtProductFoodsOptional()

    // HANDLESS
    const handleCheck = (e) => {
        const { name, checked } = e.target
        setChecker({ ...setCheck, [name]: checked ? true : false })
    }
    const handleRemoveList = i => {
        const Lines = data?.listIds?.filter((_, index) => { return index !== i })
        setData({
          listIds: [...Lines],
          lists: {
            ...data.lists
          }
        })
      }
      const removeOneItem = ({ listID, id }) => {
        const currentList = data.lists[listID]
        const totalCart = currentList?.cards?.filter((cart) => { return cart.id !== id })
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
      }
    const addCard = async (title, listId) => {
        const id = await RandomCode(9)
        const newCard = {
          id: id,
          title: title,
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
        if (valueItems !== '') {
          addCard(valueItems, listId)
        }
      }


      const handleAddList = async ({ title, numberLimit }) => {
        if (title !== '') {
          const newListId = await RandomCode(9)
          setData({
            listIds: [...data.listIds, newListId],
            lists: {
              ...data.lists,
              [newListId]: {
                id: newListId,
                title: title,
                required: setCheck.exState ? 1 : 0,
                numberLimit: numberLimit,
                value: '',
                cards: []
              }
            }
          })
          handleUpdateExtProduct({
                pId,
                code: newListId,
                OptionalProName: title,
                required: setCheck.exState ? 1 : 0,
                numbersOptionalOnly: numberLimit
          })
          setTitle('')
        }
      }
      const handleChangeItems = ({ listID, value: e }) => {
        const value = e.target.value
        setValueItems(value)
        const currentList = data.lists[listID]
        return dataListIds.map((salesLine) => {
          if (salesLine === listID) {
            setData({
              listIds: [...data.listIds],
              lists: {
                ...data.lists,
                [listID]: {
                  ...currentList,
                  value: value,
                }
              }
            })
          }
        })
      }
  return {
      setCheck,
      data,
      dataListIds,
      title,
      handleChangeItems,
      handleCheck,
      addCard,
      setTitle,
      handleAddList,
      handleAdd,
      removeOneItem,
      handleRemoveList,
      setData,
  }
}
