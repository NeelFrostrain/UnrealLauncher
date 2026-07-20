// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import type { Project } from '../../types'
import { getEngineCompatibilitySync } from '../../hooks/useEngineCompatibility'

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

// ── Project search and activity helpers ─────────────────────────────────────

const ACTIVITY_STORAGE_KEY = 'unrealLauncherProjectActivity'

type ProjectActivityType =
  'launch' | 'engine-launch' | 'plugin-change' | 'git-commit' | 'config-edit'

export interface ProjectActivityEntry {
  id: string
  projectPath: string
  projectName: string
  type: ProjectActivityType
  message: string
  timestamp: string
}

const ACTIVITY_LABELS: Record<ProjectActivityType, string> = {
  launch: 'Launch',
  'engine-launch': 'Engine',
  'plugin-change': 'Plugin',
  'git-commit': 'Git',
  'config-edit': 'Config'
}

export function getProjectActivityLabel(type: ProjectActivityType): string {
  return ACTIVITY_LABELS[type]
}

export function formatActivityTimestamp(timestamp: string): string {
  try {
    const dt = new Date(timestamp)
    if (Number.isNaN(dt.getTime())) return ''
    return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function readActivityStorage(): ProjectActivityEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProjectActivityEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeActivityStorage(entries: ProjectActivityEntry[]): void {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(entries))
}

export function addProjectActivity(
  projectPath: string,
  projectName: string,
  type: ProjectActivityType,
  message: string
): void {
  const entry: ProjectActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectPath,
    projectName,
    type,
    message,
    timestamp: new Date().toISOString()
  }

  const existing = readActivityStorage()
  const next = [entry, ...existing.filter((item) => item.projectPath !== projectPath)]
  writeActivityStorage(next.slice(0, 24))
}

export function getProjectActivitySummary(projectPath: string): string {
  const entries = readActivityStorage().filter((item) => item.projectPath === projectPath)
  if (!entries.length) return 'No recent activity'

  const latest = entries[0]
  return `${ACTIVITY_LABELS[latest.type]} · ${latest.message}`
}

export function getProjectActivityTimeline(projectPath: string): ProjectActivityEntry[] {
  return readActivityStorage()
    .filter((item) => item.projectPath === projectPath)
    .slice(0, 6)
}

export function getProjectActivityFeed(): ProjectActivityEntry[] {
  return readActivityStorage().slice(0, 20)
}

export function matchesProjectQuery(project: Project, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystacks = [
    project.name,
    project.version,
    project.projectPath ?? '',
    project.size,
    project.createdAt,
    project.lastOpenedAt ? formatDate(project.lastOpenedAt) : ''
  ]

  return haystacks.some((value) => value?.toLowerCase().includes(normalized))
}

export type EngineVersionFilter = 'all' | 'unspecified' | 'unsupported' | 'broken' | string

function normalizeEngineVersion(value: string | undefined): string {
  const normalized = (value ?? '').trim()
  if (!normalized || normalized.toLowerCase() === 'unknown') return 'unspecified'
  return normalized
}

export function filterProjectsByEngineVersion(
  projects: Project[],
  filter: EngineVersionFilter
): Project[] {
  if (!filter || filter === 'all') return projects

  if (filter === 'broken') {
    // Combined: projects with no version specified OR engine not installed
    return projects.filter((project) => {
      const version = normalizeEngineVersion(project.version)
      if (version === 'unspecified') return true
      const compat = getEngineCompatibilitySync(project.version || '')
      if (!compat) return false
      return compat.status === 'missing'
    })
  }

  if (filter === 'unsupported') {
    return projects.filter((project) => {
      const version = normalizeEngineVersion(project.version)
      if (version === 'unspecified') return false
      const compat = getEngineCompatibilitySync(project.version || '')
      if (!compat) {
        // Engines not loaded yet — conservatively include projects that have a specified version
        return version !== 'unspecified'
      }
      return compat.status === 'missing'
    })
  }

  return projects.filter((project) => {
    const version = normalizeEngineVersion(project.version)
    if (filter === 'unspecified') return version === 'unspecified'
    return version === normalizeEngineVersion(filter)
  })
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
