/** The catalogue is a draft. Only explicit checked=true is a sale selection. */
interface SelectableSubOption {
  opSubExPid?: unknown
  check?: unknown
}

interface SelectableOptionalGroup {
  opExPid?: unknown
  code?: unknown
  ExtProductFoodsSubOptionalAll?: readonly (SelectableSubOption | null)[] | null
}

export const filterSelectedOptionals = <T extends SelectableOptionalGroup>(
  groups: readonly T[] | null | undefined
): T[] => {
  if (!Array.isArray(groups)) return []

  const selected: T[] = []
  for (const group of groups as readonly T[]) {
    if (!group) continue
    const subOptions = (group.ExtProductFoodsSubOptionalAll ?? [])
      .filter(sub => sub?.check === true)
      .map(sub => ({ ...sub, check: true }))

    if (subOptions.length === 0) continue
    selected.push({ ...group, ExtProductFoodsSubOptionalAll: subOptions })
  }
  return selected
}

export const restoreOptionalSelection = <T extends SelectableOptionalGroup>(
  catalogue: readonly T[] | null | undefined,
  saved: readonly SelectableOptionalGroup[] | null | undefined
): T[] => {
  const selectedByGroup = new Map<string, Set<string>>()
  for (const group of filterSelectedOptionals(saved)) {
    if (group.opExPid == null) continue
    const key = String(group.opExPid)
    const ids = selectedByGroup.get(key) ?? new Set<string>()
    for (const sub of group.ExtProductFoodsSubOptionalAll ?? []) {
      if (sub?.opSubExPid != null) ids.add(String(sub.opSubExPid))
    }
    selectedByGroup.set(key, ids)
  }

  return (catalogue ?? []).map(group => {
    const checked = group.opExPid == null ? undefined : selectedByGroup.get(String(group.opExPid))
    return {
      ...group,
      ExtProductFoodsSubOptionalAll: (group.ExtProductFoodsSubOptionalAll ?? [])
        .filter(sub => sub != null)
        .map(sub => ({
          ...sub,
          check: sub?.opSubExPid != null && Boolean(checked?.has(String(sub.opSubExPid)))
        }))
    }
  })
}

export const toggleOptionalSelection = <T extends SelectableOptionalGroup>(
  groups: T[],
  groupCode: string | number,
  subId: string | number
): T[] => {
  const index = groups.findIndex(group => group.code != null && String(group.code) === String(groupCode))
  if (index === -1) return groups
  const group = groups[index]
  const subs = group.ExtProductFoodsSubOptionalAll ?? []
  const subIndex = subs.findIndex(sub => sub?.opSubExPid != null && String(sub.opSubExPid) === String(subId))
  if (subIndex === -1) return groups
  const current = subs[subIndex]
  const nextSubs = [...subs]
  nextSubs[subIndex] = { ...current, check: current?.check !== true }
  const next = [...groups]
  next[index] = { ...group, ExtProductFoodsSubOptionalAll: nextSubs }
  return next
}
