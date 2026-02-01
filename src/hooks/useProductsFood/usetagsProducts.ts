import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { SendNotificationFn } from 'typedefs'

import { useDeleteOneTag, useGetAllTags } from '../useTagProducts'

import { REGISTER_TAGS_PRODUCT } from './queriesStore'

interface UseTagsProductsProps {
  sendNotification?: SendNotificationFn
}
export const useTagsProducts = ({
  sendNotification = () => { }
}: UseTagsProductsProps = {}) => {
  const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)
  const [handleDeleteTag, { loading }] = useDeleteOneTag()
  const { tags: listTags } = useGetAllTags()
  const [newTags, setNewTags] = useState([])

  const [tags, setTags] = useState({
    id: '',
    tag: ''
  })

  const handleAddTag = (id: string, tag: string) => {
    if (tags.id === id) {
      setTags({
        id: '',
        tag: ''
      })
      return
    }
    setTags({
      id,
      tag
    })
  }

  const handleRemoveTag = async (tag: { id: string, tag: string }) => {
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
      sendNotification({
        title: name ?? 'error',
        description: message,
        backgroundColor: success ? 'success' : 'error'
      })
    } catch (e) {
      if (e instanceof Error) {
        sendNotification({
          title: 'Error',
          description: e.message,
          backgroundColor: 'error'
        })
        return
      }
      sendNotification({
        title: 'Error',
        description: 'error',
        backgroundColor: 'error'
      })
    }
  }

  const handleRegister = (tag: { pId: string, idUser: string, idStore: string, nameTag: string }) => {
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
    })
  }
  const data = listTags.map((tag: { tgId?: string, nameTag?: string }) => {
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
