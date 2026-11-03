import { expect } from '@jest/globals'

import {
  addDraftTag,
  canAddDraftTag,
  normalizeTags,
  removeDraftTagAt,
  resolveTagsToPersist,
  sanitizeTagName,
  toggleSelectedTag
} from './tagsProducts.helpers'

describe('tagsProducts.helpers', () => {
  describe('normalizeTags', () => {
    test('maps raw tags to { id, tag } and trims names', () => {
      const result = normalizeTags([
        { tgId: '1', nameTag: '  oferta ' },
        { tgId: '2', nameTag: 'nuevo' }
      ])

      expect(result).toEqual([
        { id: '1', tag: 'oferta' },
        { id: '2', tag: 'nuevo' }
      ])
    })

    test('drops tags without id or name', () => {
      const result = normalizeTags([
        { tgId: '', nameTag: 'sin-id' },
        { tgId: '3', nameTag: '   ' },
        { tgId: '4', nameTag: 'ok' }
      ])

      expect(result).toEqual([{ id: '4', tag: 'ok' }])
    })

    test('returns an empty array for invalid input', () => {
      expect(normalizeTags(undefined)).toEqual([])
      // @ts-expect-error testing defensive runtime behavior
      expect(normalizeTags(null)).toEqual([])
      // @ts-expect-error testing defensive runtime behavior
      expect(normalizeTags('nope')).toEqual([])
    })
  })

  describe('sanitizeTagName', () => {
    test('trims whitespace', () => {
      expect(sanitizeTagName('  hello ')).toBe('hello')
    })

    test('coerces nullish to empty string', () => {
      // @ts-expect-error testing defensive runtime behavior
      expect(sanitizeTagName(undefined)).toBe('')
      // @ts-expect-error testing defensive runtime behavior
      expect(sanitizeTagName(null)).toBe('')
    })
  })

  describe('canAddDraftTag', () => {
    test('rejects empty values', () => {
      expect(canAddDraftTag([], '   ')).toEqual({
        valid: false,
        reason: 'empty',
        tag: ''
      })
    })

    test('rejects case-insensitive duplicates', () => {
      expect(canAddDraftTag(['Oferta'], 'oferta')).toEqual({
        valid: false,
        reason: 'duplicate',
        tag: 'oferta'
      })
    })

    test('accepts a new, trimmed tag', () => {
      expect(canAddDraftTag(['oferta'], '  nuevo ')).toEqual({
        valid: true,
        tag: 'nuevo'
      })
    })
  })

  describe('addDraftTag', () => {
    test('appends a valid tag', () => {
      expect(addDraftTag(['oferta'], 'nuevo')).toEqual(['oferta', 'nuevo'])
    })

    test('ignores empty values but returns a new array', () => {
      const original = ['oferta']
      const result = addDraftTag(original, '   ')

      expect(result).toEqual(['oferta'])
      expect(result).not.toBe(original)
    })

    test('ignores duplicates', () => {
      expect(addDraftTag(['oferta'], 'OFERTA')).toEqual(['oferta'])
    })
  })

  describe('removeDraftTagAt', () => {
    test('removes the tag at the given index', () => {
      expect(removeDraftTagAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
    })

    test('returns the same values when index is out of range', () => {
      expect(removeDraftTagAt(['a', 'b'], 9)).toEqual(['a', 'b'])
    })
  })

  describe('toggleSelectedTag', () => {
    const empty = { id: '', tag: '' }

    test('selects a tag when none is selected', () => {
      expect(toggleSelectedTag(empty, { id: '1', tag: 'oferta' })).toEqual({
        id: '1',
        tag: 'oferta'
      })
    })

    test('clears selection when selecting the same tag again', () => {
      expect(
        toggleSelectedTag({ id: '1', tag: 'oferta' }, { id: '1', tag: 'oferta' })
      ).toEqual(empty)
    })

    test('switches selection to a different tag', () => {
      expect(
        toggleSelectedTag({ id: '1', tag: 'oferta' }, { id: '2', tag: 'nuevo' })
      ).toEqual({ id: '2', tag: 'nuevo' })
    })

    test('clears selection when next tag has no id', () => {
      expect(
        toggleSelectedTag({ id: '1', tag: 'oferta' }, { id: '', tag: '' })
      ).toEqual(empty)
    })
  })

  describe('resolveTagsToPersist', () => {
    test('persists a single trimmed tag', () => {
      expect(resolveTagsToPersist('  oferta ', [])).toEqual({
        toPersist: ['oferta'],
        duplicates: [],
        normalized: ['oferta']
      })
    })

    test('ignores empty values (no request)', () => {
      expect(resolveTagsToPersist('   ', [])).toEqual({
        toPersist: [],
        duplicates: [],
        normalized: []
      })
    })

    test('dedupes within the same batch (case-insensitive)', () => {
      expect(resolveTagsToPersist(['oferta', 'OFERTA', 'nuevo'], [])).toEqual({
        toPersist: ['oferta', 'nuevo'],
        duplicates: [],
        normalized: ['oferta', 'nuevo']
      })
    })

    test('splits out tags that already exist among saved tags', () => {
      const result = resolveTagsToPersist(['vegano', 'nuevo'], ['Vegano'])

      expect(result.toPersist).toEqual(['nuevo'])
      expect(result.duplicates).toEqual(['vegano'])
      expect(result.normalized).toEqual(['vegano', 'nuevo'])
    })

    test('keeps earlier tags when a later one is added (no overwrite)', () => {
      // First tag persisted independently.
      const first = resolveTagsToPersist('postres', [])
      expect(first.toPersist).toEqual(['postres'])

      // Second tag, with "postres" now saved, must not re-create it.
      const second = resolveTagsToPersist('vinos', ['postres'])
      expect(second.toPersist).toEqual(['vinos'])
      expect(second.duplicates).toEqual([])
    })

    test('returns nothing to persist when every value is a saved duplicate', () => {
      const result = resolveTagsToPersist(['postres'], ['postres'])

      expect(result.toPersist).toEqual([])
      expect(result.duplicates).toEqual(['postres'])
    })
  })

  describe('end-to-end draft flow', () => {
    test('create, dedupe, remove and select behave predictably', () => {
      // user types three tags, one duplicate
      let draft: string[] = []
      draft = addDraftTag(draft, 'oferta')
      draft = addDraftTag(draft, 'nuevo')
      draft = addDraftTag(draft, 'OFERTA') // duplicate, ignored

      expect(draft).toEqual(['oferta', 'nuevo'])

      // user removes the first draft tag
      draft = removeDraftTagAt(draft, 0)
      expect(draft).toEqual(['nuevo'])

      // saved tags rendered as chips
      const saved = normalizeTags([
        { tgId: '10', nameTag: 'vegano' },
        { tgId: '11', nameTag: 'sin gluten' }
      ])

      // user selects then unselects a saved tag
      let selected = { id: '', tag: '' }
      selected = toggleSelectedTag(selected, saved[0])
      expect(selected).toEqual({ id: '10', tag: 'vegano' })

      selected = toggleSelectedTag(selected, saved[0])
      expect(selected).toEqual({ id: '', tag: '' })
    })
  })
})
