// Copyright (c) 2026 NeelFrostrain. All rights reserved.
// @vitest-environment jsdom
import { beforeEach, describe, it, expect } from 'vitest'
import {
  formatVersion,
  formatDate,
  sortProjects,
  matchesProjectQuery,
  addProjectActivity,
  getProjectActivityFeed,
  getProjectActivitySummary,
  filterProjectsByEngineVersion
} from '../projectUtils'

// Minimal project shape used for sort tests.
// Cast to satisfy the global ProjectData type which requires thumbnail: string | undefined.
function p(
  overrides: Partial<{
    name: string
    size: string
    createdAt: string
    lastOpenedAt: string
    version: string
  }>
): ProjectData {
  return {
    name: overrides.name ?? 'Project',
    version: overrides.version ?? '5.3',
    size: overrides.size ?? '~2-5 GB',
    createdAt: overrides.createdAt ?? '2024-01-01',
    lastOpenedAt: overrides.lastOpenedAt,
    projectPath: '/some/path',
    thumbnail: undefined
  }
}

// ── formatVersion ─────────────────────────────────────────────────────────────

describe('formatVersion', () => {
  it('returns ? for empty string', () => expect(formatVersion('')).toBe('?'))
  it('returns ? for Unknown', () => expect(formatVersion('Unknown')).toBe('?'))
  it('returns Custom for GUID-style string', () =>
    expect(formatVersion('{12345678-abcd-efab-0000-123456789abc}')).toBe('Custom'))
  it('returns Custom for version string > 12 chars', () =>
    expect(formatVersion('5.3.2-release-1234')).toBe('Custom'))
  it('passes through short version string', () => expect(formatVersion('5.3')).toBe('5.3'))
  it('passes through 4-char version', () => expect(formatVersion('5.3.2')).toBe('5.3.2'))
})

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2024-06-15')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2024/)
  })

  it('returns the input unchanged for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})

// ── sortProjects ──────────────────────────────────────────────────────────────

describe('matchesProjectQuery', () => {
  const project = p({ name: 'My Project', version: '5.4', lastOpenedAt: '2024-06-15' })

  it('matches project names, engine versions, paths, and dates', () => {
    expect(matchesProjectQuery(project, 'my project')).toBe(true)
    expect(matchesProjectQuery(project, '5.4')).toBe(true)
    expect(matchesProjectQuery(project, '/some/path')).toBe(true)
    expect(matchesProjectQuery(project, 'jun')).toBe(true)
    expect(matchesProjectQuery(project, 'does-not-match')).toBe(false)
  })

  it('matches everything when the query is empty', () => {
    expect(matchesProjectQuery(project, '')).toBe(true)
  })
})

describe('filterProjectsByEngineVersion', () => {
  const projects = [
    p({ name: 'A', version: '5.4' }),
    p({ name: 'B', version: '5.3' }),
    p({ name: 'C', version: 'Unknown' }),
    p({ name: 'D', version: '' })
  ]

  it('filters to an exact engine version', () => {
    expect(filterProjectsByEngineVersion(projects, '5.4').map((project) => project.name)).toEqual([
      'A'
    ])
  })

  it('supports the unspecified bucket', () => {
    expect(
      filterProjectsByEngineVersion(projects, 'unspecified').map((project) => project.name)
    ).toEqual(['C', 'D'])
  })

  it('returns all projects for the all-versions filter', () => {
    expect(filterProjectsByEngineVersion(projects, 'all')).toHaveLength(4)
  })
})

describe('project activity helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and summarizes recent activity', () => {
    addProjectActivity('/path', 'My Project', 'launch', 'Editor launch')
    addProjectActivity('/path', 'My Project', 'config-edit', 'Edited config')

    const summary = getProjectActivitySummary('/path')
    expect(summary).toContain('Config')
  })

  it('returns the recent activity feed across projects', () => {
    addProjectActivity('/path-a', 'Alpha', 'launch', 'Opened in Editor')
    addProjectActivity('/path-b', 'Beta', 'git-commit', 'Initialized Git repo')

    const feed = getProjectActivityFeed()
    expect(feed).toHaveLength(2)
    expect(feed[0].projectName).toBe('Beta')
    expect(feed[1].projectName).toBe('Alpha')
  })
})

describe('sortProjects — by name', () => {
  const projects = [p({ name: 'Zebra' }), p({ name: 'Alpha' }), p({ name: 'Mango' })]

  it('sorts ascending', () => {
    const sorted = sortProjects(projects, { key: 'name', direction: 'asc' })
    expect(sorted.map((x) => x.name)).toEqual(['Alpha', 'Mango', 'Zebra'])
  })

  it('sorts descending', () => {
    const sorted = sortProjects(projects, { key: 'name', direction: 'desc' })
    expect(sorted.map((x) => x.name)).toEqual(['Zebra', 'Mango', 'Alpha'])
  })

  it('does not mutate the original array', () => {
    const original = [...projects]
    sortProjects(projects, { key: 'name', direction: 'asc' })
    expect(projects).toEqual(original)
  })
})

describe('sortProjects — by size', () => {
  const projects = [
    p({ name: 'Big', size: '10 GB' }),
    p({ name: 'Small', size: '200 MB' }),
    p({ name: 'Medium', size: '1.5 GB' })
  ]

  it('sorts ascending (smallest first)', () => {
    const sorted = sortProjects(projects, { key: 'size', direction: 'asc' })
    expect(sorted.map((x) => x.name)).toEqual(['Small', 'Medium', 'Big'])
  })

  it('sorts descending (largest first)', () => {
    const sorted = sortProjects(projects, { key: 'size', direction: 'desc' })
    expect(sorted.map((x) => x.name)).toEqual(['Big', 'Medium', 'Small'])
  })

  it('handles range sizes like ~35-45 GB', () => {
    const proj = [p({ name: 'Range', size: '~35-45 GB' }), p({ name: 'Exact', size: '40 GB' })]
    // Range uses lower bound (35 GB) < 40 GB, so Range sorts before Exact ascending
    const sorted = sortProjects(proj, { key: 'size', direction: 'asc' })
    expect(sorted[0].name).toBe('Range')
  })
})

describe('sortProjects — by lastOpenedAt', () => {
  const projects = [
    p({ name: 'Old', lastOpenedAt: '2023-01-01' }),
    p({ name: 'Recent', lastOpenedAt: '2025-06-01' }),
    p({ name: 'Middle', lastOpenedAt: '2024-03-15' }),
    p({ name: 'Never' }) // no lastOpenedAt
  ]

  it('sorts descending (most recent first)', () => {
    const sorted = sortProjects(projects, { key: 'lastOpenedAt', direction: 'desc' })
    expect(sorted[0].name).toBe('Recent')
    expect(sorted[sorted.length - 1].name).toBe('Never') // undefined → timestamp 0 → last
  })

  it('sorts ascending (oldest first)', () => {
    const sorted = sortProjects(projects, { key: 'lastOpenedAt', direction: 'asc' })
    expect(sorted[0].name).toBe('Never')
    expect(sorted[sorted.length - 1].name).toBe('Recent')
  })
})

describe('sortProjects — by version', () => {
  const projects = [
    p({ name: 'V53', version: '5.3' }),
    p({ name: 'V51', version: '5.1' }),
    p({ name: 'V423', version: '4.27' })
  ]

  it('sorts ascending (numeric-aware)', () => {
    const sorted = sortProjects(projects, { key: 'version', direction: 'asc' })
    expect(sorted.map((x) => x.version)).toEqual(['4.27', '5.1', '5.3'])
  })
})

describe('sortProjects — edge cases', () => {
  it('handles empty array', () => {
    expect(sortProjects([], { key: 'name', direction: 'asc' })).toEqual([])
  })

  it('handles single project', () => {
    const arr = [p({ name: 'Solo' })]
    expect(sortProjects(arr, { key: 'name', direction: 'asc' })).toHaveLength(1)
  })
})
