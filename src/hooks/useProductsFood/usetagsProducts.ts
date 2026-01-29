import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { REGISTER_TAGS_PRODUCT } from './queriesStore'
import { useDeleteOneTag, useGetAllTags } from '../useTagProducts'

export const useTagsProducts = ({
  sendNotification = () => { }
} = {}) => {
  const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)
  const [handleDeleteTag, { loading }] = useDeleteOneTag()
  const { tags: listTags } = useGetAllTags()
  const [newTags, setNewTags] = useState([])

  const [tags, setTags] = useState({
    id: '',
    tag: ''
  })

  const handleAddTag = (id, tag) => {
    if (tags.id === id) {
      return setTags({
        id: '',
        tag: ''
      })
    }
    return setTags({
      id,
      tag
    })
  }

  const handleRemoveTag = async (tag) => {
    try {
      if (loading) return
      const { id: tgId, tag: nameTag } = tag ?? {
        tgId: null,
        nameTag: null
      }
      const response = await handleDeleteTag({ tgId, nameTag })
      const {
        success = false,
        message = '',
        data
      } = response ?? {}

      const name = data?.nameTag ?? ''
      return sendNotification({
        title: name ?? 'error',
        description: message,
        backgroundColor: success ? 'success' : 'error'
      })
    } catch (e) {
      sendNotification({
        title: 'Error',
        description: 'error',
        backgroundColor: 'error'
      })
    }
  }

  const handleRegister = tag => {
    const {
      pId,
      idUser,
      idStore,
      nameTag
    } = tag || {}

    registerTag({
      variables: {
        input: {
          pId,
          idUser,
          nameTag,
          idStore
        }
      }
    }).catch(err => { return console.log({ message: `${err}`, duration: 7000 }) })
  }
  const data = listTags.map((tag) => {
    return {
      id: tag?.tgId ?? '',
      tag: String(tag?.nameTag ?? '')
    }
  })

  return {
    tags,
    error: false,
    data,
    loading: false,
    newTags: newTags ?? [],
    setNewTags,
    handleRegister,
    handleRemoveTag,
    handleAddTag
  }
}
