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

export function parseVersionParts(v: string | undefined): number[] {
  if (!v) return []
  const clean = String(v)
    .trim()
    .replace(/^[^\d]*/, '')
  const match = clean.match(/^\d+(\.\d+)*/)
  if (!match) return []
  return match[0].split('.').map((n) => parseInt(n, 10))
}

export function compareEngineVersions(
  verA: string | undefined,
  verB: string | undefined,
  direction: 'asc' | 'desc' = 'desc'
): number {
  const pA = parseVersionParts(verA)
  const pB = parseVersionParts(verB)
  const max = Math.max(pA.length, pB.length)
  for (let i = 0; i < max; i++) {
    const numA = pA[i] ?? 0
    const numB = pB[i] ?? 0
    if (numA !== numB) {
      return direction === 'asc' ? numA - numB : numB - numA
    }
  }
  const strCmp = String(verA || '').localeCompare(String(verB || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  })
  return direction === 'asc' ? strCmp : -strCmp
}

export function sortEngineList<
  T extends { version?: string; fullVersion?: string; directoryPath?: string }
>(engines: T[], direction: 'asc' | 'desc' = 'desc'): T[] {
  return [...engines].sort((a, b) => {
    const verA = a.fullVersion || a.version || ''
    const verB = b.fullVersion || b.version || ''
    const cmp = compareEngineVersions(verA, verB, direction)
    if (cmp !== 0) return cmp
    return (a.directoryPath || '').localeCompare(b.directoryPath || '')
  })
}
