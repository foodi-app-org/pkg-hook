import { useMutation } from '@apollo/client'
import { useEffect, useState } from 'react'

import {
  useDeleteOneTag,
  useGetAllTags,
  useRegisterMultipleTags
} from '../useTagProducts'

import { REGISTER_TAGS_PRODUCT } from './queriesStore'
import {
  addDraftTag,
  canAddDraftTag,
  normalizeTags,
  removeDraftTagAt,
  resolveTagsToPersist,
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
 * 1. Draft tags: tags being created but not yet persisted.
 * 2. Saved tags: tags already stored for the store.
 * 3. Selected tag: saved tag currently selected for the product.
 * @param root0
 * @param root0.sendNotification
 */
export const useTagsProducts = ({
  sendNotification = () => {}
}: UseTagsProductsProps = {}) => {
  const [registerTag] = useMutation(REGISTER_TAGS_PRODUCT)

  const [handleDeleteTag, { loading: loadingDelete }] =
    useDeleteOneTag()

  const {
    tags: listTags,
    loading: loadingList
  } = useGetAllTags()

  // Draft tags: being created, not yet persisted.
  const [newTags, setNewTags] = useState<string[]>([])

  // Currently selected saved tag.
  const [tags, setTags] = useState<TagItem>(EMPTY_SELECTED)

  // Tag waiting to be selected after being persisted.
  const [pendingTagSelection, setPendingTagSelection] =
    useState<string | null>(null)

  const [registerMultipleTags, { loading: loadingRegister }] =
    useRegisterMultipleTags({
      callback: (response) => {
        const {
          success = false,
          message = ''
        } = response ?? {}

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
   * Automatically selects the newly created tag once it appears
   * in the saved tags list.
   */
  useEffect(() => {
    if (!pendingTagSelection) return

    const createdTag = dataTags.find(
      ({ tag }) =>
        tag.trim().toLowerCase() ===
        pendingTagSelection.trim().toLowerCase()
    )

    if (!createdTag) return

    setTags(createdTag)
    setPendingTagSelection(null)
  }, [dataTags, pendingTagSelection])

  /**
   * Adds a draft tag from a raw value.
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
   * @param {number} index - Position of the draft tag.
   */
  const handleRemoveDraftTag = (index: number): void => {
    setNewTags((previous) => removeDraftTagAt(previous, index))
  }

  /**
   * Selects or unselects a saved tag.
   *
   * @param {string} id - Tag id.
   * @param {string} tag - Tag name.
   * @returns {boolean} Whether a tag is selected.
   */
  const handleAddTag = (id: string, tag: string): boolean => {
    const next = toggleSelectedTag(tags, { id, tag })

    setTags(next)

    return Boolean(next.id)
  }

  /**
   * Clears the current tag selection.
   */
  const handleClearSelectedTag = (): void => {
    setTags(EMPTY_SELECTED)
  }

  /**
   * Deletes a saved tag permanently.
   *
   * @param {TagItem} tag - Tag to delete.
   */
  const handleRemoveTag = async (tag: TagItem): Promise<void> => {
    try {
      if (loadingDelete) return

      const {
        id: tgId,
        tag: nameTag
      } = tag ?? EMPTY_SELECTED

      if (!tgId) return

      // Clear selection when deleting the currently selected tag.
      if (tags.id === tgId) {
        setTags(EMPTY_SELECTED)
      }

      const response = await handleDeleteTag({
        tgId,
        nameTag
      })

      const {
        success = false,
        message = ''
      } = response ?? {}

      sendNotification({
        title: success ? 'Tag eliminado' : 'Error',
        description:
          message ||
          (success
            ? 'Tag eliminado.'
            : 'No fue posible eliminar el tag.'),
        backgroundColor: success ? 'success' : 'error'
      })
    } catch (e) {
      sendNotification({
        title: 'Error',
        description:
          e instanceof Error
            ? e.message
            : 'Ocurrió un error al eliminar el tag.',
        backgroundColor: 'error'
      })
    }
  }

  /**
   * Creates and persists tag(s).
   *
   * 1. Normalizes and validates the incoming values.
   * 2. Rejects empty values.
   * 3. Rejects duplicates against saved tags.
   * 4. Persists new tags.
   * 5. Automatically selects the last successfully created tag.
   *
   * @param {string | string[]} value - Tag name(s).
   * @returns {Promise<boolean>} Whether the operation succeeded.
   */
  const registerTags = async (
    value: string | string[] = newTags
  ): Promise<boolean> => {
    const {
      toPersist,
      duplicates,
      normalized
    } = resolveTagsToPersist(
      value,
      (dataTags ?? []).map(({ tag }) => tag)
    )

    if (normalized.length === 0) {
      sendNotification({
        title: 'Sin tags',
        description: 'Agrega al menos un tag antes de guardar.',
        backgroundColor: 'warning'
      })

      return false
    }

    if (duplicates.length > 0) {
      sendNotification({
        title: 'Tag repetido',
        description:
          duplicates.length === 1
            ? `El tag "${duplicates[0]}" ya está guardado.`
            : `Algunos tags ya estaban guardados: ${duplicates.join(', ')}.`,
        backgroundColor: 'warning'
      })
    }

    if (toPersist.length === 0) {
      return true
    }

    try {
      const response = await registerMultipleTags(toPersist)

      const { success = false } = response ?? {}

      if (!success) {
        return false
      }

      // Wait for the newly created tag to appear in dataTags.
      // The useEffect above will select it using its actual id.
      setPendingTagSelection(toPersist[toPersist.length - 1])

      return true
    } catch (e) {
      sendNotification({
        title: 'Error',
        description:
          e instanceof Error
            ? e.message
            : 'No fue posible guardar los tags.',
        backgroundColor: 'error'
      })

      return false
    }
  }

  /**
   * Registers a single tag already linked to a product (legacy flow).
   *
   * @param {object} tag - Tag input.
   * @param tag.pId
   * @param tag.idUser
   * @param tag.idStore
   * @param tag.nameTag
   */
  const handleRegister = (tag: {
    pId: string
    idUser: string
    idStore: string
    nameTag: string
  }) => {
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

  return {
    // Selection
    tags,
    handleAddTag,
    handleClearSelectedTag,

    // Saved tags
    dataTags,
    data: dataTags,
    handleRemoveTag,

    // Draft tags
    newTags: newTags ?? [],
    setNewTags,
    handleAddDraftTag,
    handleRemoveDraftTag,
    registerTags,

    // Legacy single register
    handleRegister,

    // State
    error: false,
    loading: loadingList,
    loadingTags: loadingRegister,
    loadingDelete
  }
}