// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { Project } from '../../types'

export const formatVersion = (v: string): string => {
  if (!v || v === 'Unknown') return '?'
  if (v.startsWith('{') || v.length > 12) return 'Custom'
  return v
}

export const formatDate = (d: string): string => {
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return d
  }
}

export const showErrorToast = (message: string): void => {
  const msg = document.createElement('div')
  msg.textContent = message
  Object.assign(msg.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '99999',
    background: 'var(--color-surface-elevated)',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '12px',
    maxWidth: '360px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
  })
  document.body.appendChild(msg)
  setTimeout(() => msg.remove(), 5000)
}

// ── Sorting ───────────────────────────────────────────────────────────────────

export type SortKey = 'name' | 'size' | 'createdAt' | 'lastOpenedAt' | 'version'
export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: 'name', label: 'Name (A–Z)' },
  { key: 'lastOpenedAt', label: 'Last Opened' },
  { key: 'createdAt', label: 'Date Created' },
  { key: 'size', label: 'Size' },
  { key: 'version', label: 'Engine Version' }
]

/** Parse a size string like "1.2 GB", "340 MB", "~35-45 GB" into bytes for comparison */
function parseSizeBytes(size: string): number {
  if (!size) return -1
  const clean = size.replace(/[~<>]/g, '').trim()
  // Handle ranges like "35-45 GB" — use the lower bound
  const rangeMatch = clean.match(/^([\d.]+)\s*[-–]\s*[\d.]+\s*(GB|MB|KB|B)/i)
  if (rangeMatch) {
    const val = parseFloat(rangeMatch[1])
    return toBytes(val, rangeMatch[2])
  }
  const match = clean.match(/^([\d.]+)\s*(GB|MB|KB|B)/i)
  if (!match) return -1
  return toBytes(parseFloat(match[1]), match[2])
}

function toBytes(val: number, unit: string): number {
  switch (unit.toUpperCase()) {
    case 'GB':
      return val * 1024 ** 3
    case 'MB':
      return val * 1024 ** 2
    case 'KB':
      return val * 1024
    default:
      return val
  }
}

function toTimestamp(d: string | undefined): number {
  if (!d) return 0
  try {
    return new Date(d).getTime()
  } catch {
    return 0
  }
}

export function sortProjects(projects: Project[], config: SortConfig): Project[] {
  const { key, direction } = config
  const mul = direction === 'asc' ? 1 : -1

  return [...projects].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'name':
        cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        break
      case 'size':
        cmp = parseSizeBytes(a.size) - parseSizeBytes(b.size)
        break
      case 'createdAt':
        cmp = toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
        break
      case 'lastOpenedAt':
        cmp = toTimestamp(a.lastOpenedAt) - toTimestamp(b.lastOpenedAt)
        break
      case 'version':
        cmp = (a.version || '').localeCompare(b.version || '', undefined, { numeric: true })
        break
    }
    return cmp * mul
  })
}
