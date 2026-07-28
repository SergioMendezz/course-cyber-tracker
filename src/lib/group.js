export function groupBySubmodule(entries = []) {
  const map = new Map()
  for (const e of entries) {
    const key = e.submodule?.trim() || 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return [...map.entries()]
}
