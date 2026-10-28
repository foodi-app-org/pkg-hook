
/**
 * Removes Apollo's `__typename` metadata recursively from GraphQL input data.
 *
 * @template T
 * @param {T} value - Value to sanitize.
 * @returns {T} A sanitized copy without `__typename` fields.
 */
export const stripTypename = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(stripTypename) as T
  }

  if (value === null || typeof value !== 'object') {
    return value
  }

  const sanitized = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== '__typename')
      .map(([key, nestedValue]) => [key, stripTypename(nestedValue)])
  )

  return sanitized as T
}
