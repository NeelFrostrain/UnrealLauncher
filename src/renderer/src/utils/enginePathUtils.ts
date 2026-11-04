// Copyright (c) 2026 NeelFrostrain. All rights reserved.

export function normalizeEnginePathKey(p: string): string {
  if (!p) return ''
  return p.replace(/\\/g, '/').toLowerCase()
}

export function dedupeEngineList<T extends { directoryPath: string }>(engines: T[]): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const engine of engines) {
    if (!engine?.directoryPath) continue
    const key = normalizeEnginePathKey(engine.directoryPath)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(engine)
    }
  }
  return result
}
