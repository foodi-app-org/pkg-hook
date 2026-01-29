export const jaccardSimilarity = (s1, s2) => {
  const set1 = new Set(s1)
  const set2 = new Set(s2)
  const intersection = new Set([...set1].filter(x => { return set2.has(x) }))
  const union = new Set([...set1, ...set2])
  return intersection.size / union.size
}
