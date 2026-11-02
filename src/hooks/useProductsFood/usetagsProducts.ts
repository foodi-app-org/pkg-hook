import { useMutation } from '@apollo/client'
import { useState } from 'react'


import { useDeleteOneTag, useGetAllTags, useRegisterMultipleTags } from '../useTagProducts'

import { REGISTER_TAGS_PRODUCT } from './queriesStore'
import {
  addDraftTag,
  canAddDraftTag,
  normalizeTags,
  removeDraftTagAt,
  toggleSelectedTag,
  type TagItem
} from './tagsProducts.helpers'

import type { SendNotificationFn } from 'typesdefs'

interface UseTagsProductsProps {
  sendNotification?: SendNotificationFn
}

const EMPTY_SELECTED: TagItem = {
  id: '',
  tag: ''
}

/**
 * Hook that drives the product tags experience.
 *
 * It exposes a small, predictable API split in two clear concepts:
 *
 * 1. Draft tags (`newTags`): tags the user is typing/creating but has not
 *    saved yet. They live only in local state until `registerTags` runs.
 * 2. Saved tags (`dataTags`): tags already stored for the store, rendered as
 *    chips the user can select (to reuse) or delete.
 *
 * @param {UseTagsProductsProps} props - Optional notification handler.
 * @returns Tags API consumed by the product form.
 */
export const useTagsProducts = ({
  sendNotification = () => { }
}: UseTagsProductsProps = {}) => {
  const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)
  const [handleDeleteTag, { loading: loadingDelete }] = useDeleteOneTag()
  const { tags: listTags, loading: loadingList } = useGetAllTags()

  // Draft tags: being created, not yet persisted.
  const [newTags, setNewTags] = useState<string[]>([])

  // Currently selected saved tag (reused on the product).
  const [tags, setTags] = useState<TagItem>(EMPTY_SELECTED)

  const [registerMultipleTags, { loading: loadingRegister }] =
    useRegisterMultipleTags({
      callback: (response) => {
        const { success = false, message = '' } = response ?? {}

        sendNotification({
          title: success ? 'Tags guardados' : 'Error',
          description: success
            ? 'Tus tags se guardaron correctamente.'
            : (message || 'No fue posible guardar los tags.'),
          backgroundColor: success ? 'success' : 'error'
        })

        if (success) {
          setNewTags([])
        }
      }
    })

  // Saved tags normalized for the UI.
  const dataTags = normalizeTags(listTags)

  /**
   * Adds a draft tag from a raw value, notifying the user on duplicates.
   *
   * @param {string} value - Raw text typed by the user.
   * @returns {boolean} Whether the tag was added.
   */
  const handleAddDraftTag = (value: string): boolean => {
    const check = canAddDraftTag(newTags, value)

    if (!check.valid) {
      if (check.reason === 'duplicate') {
        sendNotification({
          title: 'Tag repetido',
          description: `El tag "${check.tag}" ya está en la lista.`,
          backgroundColor: 'warning'
        })
      }

      return false
    }

    setNewTags((previous) => addDraftTag(previous, value))

    return true
  }

  /**
   * Removes a draft tag by index.
   *
   * @param {number} index - Position of the draft tag to remove.
   * @returns {void}
   */
  const handleRemoveDraftTag = (index: number): void => {
    setNewTags((previous) => removeDraftTagAt(previous, index))
  }

  /**
   * Selects (or unselects) a saved tag so it can be reused on the product.
   *
   * @param {string} id - Tag id.
   * @param {string} tag - Tag name.
   * @returns {boolean} Whether a tag is selected after the toggle.
   */
  const handleAddTag = (id: string, tag: string): boolean => {
    const next = toggleSelectedTag(tags, { id, tag })

    setTags(next)

    return Boolean(next.id)
  }

  /**
   * Clears the current selection.
   *
   * @returns {void}
   */
  const handleClearSelectedTag = (): void => {
    setTags(EMPTY_SELECTED)
  }

  /**
   * Deletes a saved tag permanently and notifies the result.
   *
   * @param {TagItem} tag - Tag to delete.
   * @returns {Promise<void>}
   */
  const handleRemoveTag = async (tag: TagItem): Promise<void> => {
    try {
      if (loadingDelete) return

      const { id: tgId, tag: nameTag } = tag ?? EMPTY_SELECTED

      if (!tgId) return

      // Keep selection in sync when the selected tag is deleted.
      if (tags.id === tgId) {
        setTags(EMPTY_SELECTED)
      }

      const response = await handleDeleteTag({ tgId, nameTag })
      const { success = false, message = '' } = response ?? {}

      sendNotification({
        title: success ? 'Tag eliminado' : 'Error',
        description: message || (success ? 'Tag eliminado.' : 'No fue posible eliminar el tag.'),
        backgroundColor: success ? 'success' : 'error'
      })
    } catch (e) {
      sendNotification({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Ocurrió un error al eliminar el tag.',
        backgroundColor: 'error'
      })
    }
  }

  /**
   * Persists the current draft tags in bulk.
   *
   * @param {string[]} [draft] - Optional explicit draft list.
   * @returns {Promise<void>}
   */
  const registerTags = async (draft: string[] = newTags): Promise<void> => {
    const toSave = (draft ?? []).map((item) => String(item).trim()).filter(Boolean)

    if (toSave.length === 0) {
      sendNotification({
        title: 'Sin tags',
        description: 'Agrega al menos un tag antes de guardar.',
        backgroundColor: 'warning'
      })

      return
    }

    try {
      await registerMultipleTags(toSave)
    } catch (e) {
      sendNotification({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No fue posible guardar los tags.',
        backgroundColor: 'error'
      })
    }
  }

  /**
   * Registers a single tag already linked to a product (legacy flow).
   *
   * @param {object} tag - Tag input.
   * @param {string} tag.pId - Product id.
   * @param {string} tag.idUser - User id.
   * @param {string} tag.idStore - Store id.
   * @param {string} tag.nameTag - Tag name.
   * @returns {void}
   */
  const handleRegister = (tag: { pId: string, idUser: string, idStore: string, nameTag: string }) => {
    const { pId, idUser, idStore, nameTag } = tag || {}

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

  return {
    // selection
    tags,
    handleAddTag,
    handleClearSelectedTag,

    // saved tags
    dataTags,
    data: dataTags,
    handleRemoveTag,

    // draft tags
    newTags: newTags ?? [],
    setNewTags,
    handleAddDraftTag,
    handleRemoveDraftTag,
    registerTags,

    // legacy single register
    handleRegister,

    // state
    error: false,
    loading: loadingList,
    loadingTags: loadingRegister,
    loadingDelete
  }
}
