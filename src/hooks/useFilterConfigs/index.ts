// useFilterConfigs.ts
import { gql, useQuery } from '@apollo/client'

/**
 * GraphQL query: returns active filter configs scoped to a store (or global).
 * The backend parses the JSONB column into typed FilterTab objects and
 * hydrates dynamic groups (e.g. product categories) at runtime.
 */
const GET_FILTER_CONFIGS = gql`
  query GetFilterConfigs($idStore: String) {
    filterConfigs(idStore: $idStore) {
      id
      idStore
      active
      priority
      filterTabs {
        id
        name
        filterGroups {
          id
          description
          displayType
          queryKey
          selectionMode
          source
          values {
            id
            description
            value
            imageUrn
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

// ─── Type definitions ────────────────────────────────────────────────────────

export type FilterValue = {
  id?: string
  description: string
  value?: number | string | null
  imageUrn?: string | null
}

export type FilterGroup = {
  id: string
  description: string
  displayType: string
  /** Query variable this group maps to (e.g. 'categories', 'orderBy', 'priceRange', 'pState'). */
  queryKey?: string | null
  /** 'single' or 'multi'. */
  selectionMode?: string | null
  /** Dynamic source (e.g. 'PRODUCT_CATEGORIES'). */
  source?: string | null
  values: FilterValue[]
}

export type FilterTab = {
  id: string
  name: string
  filterGroups: FilterGroup[]
}

export type FilterConfigRecord = {
  id: string
  idStore: string | null
  filterTabs: FilterTab[]
  active: boolean
  priority: number
}

/**
 * Map of groupId → Set (or array) of selected value ids.
 * Mirrors the FilterSelection shape used by the UI viewer.
 */
export type FilterSelectionInput = Record<string, Set<string> | string[]>

/**
 * Reusable query variables produced from a selection. These match the
 * `productFoodsAll` arguments but the builder is generic enough to feed
 * any list query that shares these conventions.
 */
export type FilterQueryVariables = {
  categories?: string[]
  orderBy?: string[]
  priceMin?: number
  priceMax?: number
  pState?: number
  [key: string]: unknown
}

// ─── Runtime shape guard ─────────────────────────────────────────────────────

const isFilterTabs = (data: unknown): data is FilterTab[] => {
  if (!Array.isArray(data)) return false
  for (const tab of data) {
    if (typeof tab?.id !== 'string' || typeof tab?.name !== 'string') return false
    if (!Array.isArray(tab.filterGroups)) return false
    for (const g of tab.filterGroups) {
      if (typeof g?.id !== 'string') return false
      if (!Array.isArray(g.values)) return false
    }
  }
  return true
}

// ─── Generic selection → query-variables translator ──────────────────────────

/**
 * Normalizes a selection entry to an array of selected value ids.
 */
const toIdArray = (entry: Set<string> | string[] | undefined): string[] => {
  if (!entry) return []
  return Array.isArray(entry) ? entry : Array.from(entry)
}

/**
 * Finds a value definition inside a group by its id.
 */
const findValue = (group: FilterGroup, id: string): FilterValue | undefined =>
  group.values.find(v => (v.id ?? v.description) === id)

/**
 * Translates a user selection into reusable query variables, driven entirely
 * by each group's `queryKey`. This makes the filter button reusable for any
 * query: add a group with a `queryKey` and it maps automatically.
 *
 * Supported queryKeys:
 *  - 'categories'  → string[] of selected ids
 *  - 'orderBy'     → string[] like ['ProPrice:ASC'] (ignores 'DEFAULT')
 *  - 'priceRange'  → parses a value 'min:max' into priceMin / priceMax
 *  - 'pState'      → number from the selected value
 *  - any other key → array of raw value payloads (or single value for 'single' mode)
 *
 * @param tabs - The filter tab definitions (from the hook).
 * @param selection - Map of groupId → selected value ids.
 * @returns Query variables ready to pass to productFoodsAll (or any compatible query).
 */
export const buildFilterVariables = (
  tabs: FilterTab[],
  selection: FilterSelectionInput
): FilterQueryVariables => {
  const vars: FilterQueryVariables = {}

  const groups = tabs.flatMap(t => t.filterGroups ?? [])

  for (const group of groups) {
    const selectedIds = toIdArray(selection[group.id])
    if (selectedIds.length === 0) continue

    const key = group.queryKey ?? group.id

    switch (key) {
      case 'categories': {
        vars.categories = [...(vars.categories ?? []), ...selectedIds]
        break
      }
      case 'orderBy': {
        const order = selectedIds
          .filter(id => id && id !== 'DEFAULT')
        if (order.length > 0) vars.orderBy = order
        break
      }
      case 'priceRange': {
        // Each selected value holds 'min:max' (max optional) e.g. '10000:30000' or '50000:'
        const raw = findValue(group, selectedIds[0])?.value
        if (typeof raw === 'string' && raw.includes(':')) {
          const [minStr, maxStr] = raw.split(':')
          const min = Number(minStr)
          const max = Number(maxStr)
          if (Number.isFinite(min) && minStr !== '') vars.priceMin = min
          if (Number.isFinite(max) && maxStr !== '') vars.priceMax = max
        }
        break
      }
      case 'pState': {
        const raw = findValue(group, selectedIds[0])?.value
        const num = Number(raw)
        if (Number.isFinite(num)) vars.pState = num
        break
      }
      default: {
        // Generic passthrough: resolve to raw value payloads so arbitrary
        // future groups work without code changes.
        const payloads = selectedIds.map(id => findValue(group, id)?.value ?? id)
        vars[key] = group.selectionMode === 'single' ? payloads[0] : payloads
      }
    }
  }

  return vars
}

// ─── Hook options / return ───────────────────────────────────────────────────

export type UseFilterConfigsOptions = {
  idStore?: string | null
  pollIntervalMs?: number
  skip?: boolean
  onError?: (err: Error) => void
}

export type UseFilterConfigsResult = {
  data: FilterTab[]
  rawRecords: FilterConfigRecord[] | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  /** Translates a selection into reusable query variables. */
  buildVariables: (selection: FilterSelectionInput) => FilterQueryVariables
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetches filter configs from the backend and exposes typed, validated tabs.
 * Picks the active record with the lowest `priority` number.
 * Falls back to an empty array when data is missing or malformed.
 */
export const useFilterConfigs = ({
  idStore,
  skip = false,
  onError
}: UseFilterConfigsOptions = {}): UseFilterConfigsResult => {
  const { data, loading, error, refetch } = useQuery(GET_FILTER_CONFIGS, {
    variables: idStore ? { idStore } : undefined,
    skip
  })

  if (error && onError) onError(error as Error)

  const rawRecords: FilterConfigRecord[] | null = Array.isArray(
    (data as any)?.filterConfigs
  )
    ? (data as any).filterConfigs
    : null

  let tabs: FilterTab[] = []

  if (rawRecords && rawRecords.length > 0) {
    // Pick the active record with the highest priority (lowest number)
    const candidate = rawRecords
      .filter(r => r.active !== false)
      .sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999))[0]
      ?? rawRecords[0]

    if (candidate && isFilterTabs(candidate.filterTabs)) {
      tabs = candidate.filterTabs
    } else {
      console.warn('useFilterConfigs: invalid filterTabs structure', candidate?.filterTabs)
    }
  }

  return {
    data: tabs,
    rawRecords,
    loading,
    error: error ? (error as Error) : null,
    refetch: async () => {
      await refetch()
    },
    buildVariables: (selection: FilterSelectionInput) =>
      buildFilterVariables(tabs, selection)
  }
}
