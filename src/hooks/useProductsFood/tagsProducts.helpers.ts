/**
 * Pure, framework-free helpers for the product tags flow.
 *
 * These functions hold the "business rules" of the tags experience so the
 * behavior can be unit tested without React or Apollo.
 */

/**
 * A normalized tag as consumed by the UI (chip list).
 */
export interface TagItem {
  id: string
  tag: string
}

/**
 * Raw tag shape returned by the GraphQL layer.
 */
export interface RawTag {
  tgId?: string
  nameTag?: string
}

/**
 * Normalizes a raw tag list coming from the API into the UI shape.
 *
 * @param {RawTag[]} rawTags - Tags as returned by the server.
 * @returns {TagItem[]} Normalized tags ready to render.
 */
export const normalizeTags = (rawTags: RawTag[] = []): TagItem[] => {
  if (!Array.isArray(rawTags)) return []

  return rawTags
    .map((tag) => ({
      id: String(tag?.tgId ?? ''),
      tag: String(tag?.nameTag ?? '').trim()
    }))
    .filter((tag) => tag.id !== '' && tag.tag !== '')
}

/**
 * Cleans a raw text value into a tag name.
 *
 * @param {string} value - Raw user input.
 * @returns {string} Trimmed tag name.
 */
export const sanitizeTagName = (value: string): string => {
  return String(value ?? '').trim()
}

/**
 * Decides whether a draft tag can be added to the current draft list.
 *
 * Rules (kept intentionally simple for the end user):
 * - Empty values are rejected.
 * - Duplicates (case-insensitive) are rejected.
 *
 * @param {string[]} draftTags - Current draft tags not yet saved.
 * @param {string} value - New tag name candidate.
 * @returns {{ valid: boolean, reason?: 'empty' | 'duplicate', tag: string }}
 */
export const canAddDraftTag = (
  draftTags: string[] = [],
  value: string
): { valid: boolean, reason?: 'empty' | 'duplicate', tag: string } => {
  const tag = sanitizeTagName(value)

  if (tag === '') {
    return { valid: false, reason: 'empty', tag }
  }

  const exists = (draftTags ?? []).some(
    (item) => sanitizeTagName(item).toLowerCase() === tag.toLowerCase()
  )

  if (exists) {
    return { valid: false, reason: 'duplicate', tag }
  }

  return { valid: true, tag }
}

/**
 * Adds a draft tag if it passes validation, returning the next list.
 *
 * @param {string[]} draftTags - Current draft tags.
 * @param {string} value - New tag name candidate.
 * @returns {string[]} Next draft list (unchanged when invalid).
 */
export const addDraftTag = (
  draftTags: string[] = [],
  value: string
): string[] => {
  const { valid, tag } = canAddDraftTag(draftTags, value)

  if (!valid) return [...(draftTags ?? [])]

  return [...(draftTags ?? []), tag]
}

/**
 * Removes a draft tag by index.
 *
 * @param {string[]} draftTags - Current draft tags.
 * @param {number} index - Index to remove.
 * @returns {string[]} Next draft list.
 */
export const removeDraftTagAt = (
  draftTags: string[] = [],
  index: number
): string[] => {
  return (draftTags ?? []).filter((_, position) => position !== index)
}

/**
 * Toggles the selected tag.
 *
 * Selecting the already-selected tag clears the selection, which lets the
 * same control act as select/unselect.
 *
 * @param {TagItem} current - Currently selected tag.
 * @param {TagItem} next - Tag the user interacted with.
 * @returns {TagItem} Next selection ({ id: '', tag: '' } when cleared).
 */
export const toggleSelectedTag = (
  current: TagItem,
  next: TagItem
): TagItem => {
  const emptyTag: TagItem = { id: '', tag: '' }

  if (!next?.id) return emptyTag

  if (current?.id === next.id) return emptyTag

  return { id: next.id, tag: next.tag }
}
