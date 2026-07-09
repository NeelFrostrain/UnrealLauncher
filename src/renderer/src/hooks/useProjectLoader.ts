// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Handles loading, scanning, and live-update subscriptions for the project list.
 * Extracted from useProjectsPageState to keep each hook under 150 lines.
 */
import {
  useState,
  useCallback,
  useEffect,
  MutableRefObject,
  type Dispatch,
  type SetStateAction
} from 'react'
import type { Project, TabType } from '../types'
import { clearGitCache, primeGitCache } from './useGitStatus'
import { useToast } from '../components/ui/ToastContext'
import { logActivity } from '../utils/activityLogger'

function normalizeProjectPath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase()
}

export function dedupeProjectList(source: Project[]): Project[] {
  const seen = new Set<string>()
  return source.filter((project) => {
    const rawPath = project.projectPath
    if (!rawPath) return false
    const key = normalizeProjectPath(rawPath)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

interface Options {
  allProjectsRef: MutableRefObject<Project[]>
  currentTabRef: MutableRefObject<TabType>
  favoritePathsRef: MutableRefObject<string[]>
  hiddenPathsRef: MutableRefObject<string[]>
  filterForTab: (tab: TabType, src: Project[], fav: string[], hid: string[]) => Project[]
  setProjects: Dispatch<SetStateAction<Project[]>>
  setScanEpoch: (fn: (e: number) => number) => void
}

export function useProjectLoader({
  allProjectsRef,
  currentTabRef,
  favoritePathsRef,
  hiddenPathsRef,
  filterForTab,
  setProjects,
  setScanEpoch
}: Options): {
  loadProjects: (source: 'saved' | 'scan') => Promise<Project[]>
  loadProjectsForTab: (tab: TabType) => Promise<Project[]>
  loading: boolean
  backgroundScanning: boolean
  refresh: () => Promise<void>
} {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [backgroundScanning, setBackgroundScanning] = useState(false)

  const loadProjects = useCallback(
    async (source: 'saved' | 'scan'): Promise<Project[]> => {
      if (!window.electronAPI) return []
      if (source === 'saved') setLoading(true)
      else setBackgroundScanning(true)
      try {
        logActivity('Projects load started', { source })
        const raw =
          source === 'saved'
            ? await window.electronAPI.loadSavedProjects()
            : await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)

        // Apply cached sizes from previous runs to improve perceived performance
        try {
          const rawCache = localStorage.getItem('projectSizeCache')
          if (rawCache) {
            const cache = JSON.parse(rawCache) as Record<string, string>
            for (const p of deduped) {
              if (!p.size && p.projectPath) {
                const cached = cache[p.projectPath]
                if (cached) p.size = cached
              }
            }
          }
        } catch {
          /* ignore cache parse errors */
        }

        // Incremental detection: compare a lightweight snapshot to avoid reprocessing unchanged projects
        try {
          const snapshotKey = 'projectsSnapshot'
          const prevRaw = localStorage.getItem(snapshotKey)
          const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, string>) : {}
          const nextSnapshot: Record<string, string> = {}
          const changed: string[] = []
          for (const p of deduped) {
            const key = p.projectPath ?? ''
            const fingerprint = JSON.stringify({ name: p.name, version: p.version, lastOpenedAt: p.lastOpenedAt })
            if (key) {
              nextSnapshot[key] = fingerprint
              if (!prev[key] || prev[key] !== fingerprint) changed.push(key)
            } else {
              // if no path, consider changed so derived data gets recalculated later
              if (p.projectPath) changed.push(p.projectPath)
            }
          }
          localStorage.setItem(snapshotKey, JSON.stringify(nextSnapshot))

          if (changed.length > 0) {
            try {
              // Remove size cache entries for changed projects so next size calculation refreshes
              const rawSizeCache = localStorage.getItem('projectSizeCache')
              const sizeCache = rawSizeCache ? (JSON.parse(rawSizeCache) as Record<string, string>) : {}
              let mutated = false
              for (const c of changed) {
                if (sizeCache[c]) {
                  delete sizeCache[c]
                  mutated = true
                }
              }
              if (mutated) localStorage.setItem('projectSizeCache', JSON.stringify(sizeCache))
            } catch {
              /* ignore */
            }

            // Trigger background size recalculation for changed projects
            for (const c of changed) {
              if (c) window.electronAPI.calculateProjectSize(c).catch(() => {})
            }
          }
        } catch {
          /* ignore snapshot errors */
        }

        allProjectsRef.current = deduped
        setProjects(
          filterForTab(
            currentTabRef.current,
            deduped,
            favoritePathsRef.current,
            hiddenPathsRef.current
          )
        )
        setScanEpoch((e) => e + 1)
        logActivity('Projects load completed', {
          source,
          rawCount: raw.length,
          dedupedCount: deduped.length
        })
        primeGitCache(deduped.map((p) => p.projectPath).filter(Boolean) as string[])
        return deduped
      } catch (err) {
        logActivity('Projects load failed', {
          source,
          error: err instanceof Error ? err.message : String(err)
        })
        console.error(`loadProjects(${source}) failed:`, err)
        addToast(
          `Failed to load projects (${source}): ${err instanceof Error ? err.message : String(err)}`,
          'error'
        )
        return []
      } finally {
        if (source === 'saved') setLoading(false)
        else setBackgroundScanning(false)
      }
    },
    [
      filterForTab,
      allProjectsRef,
      currentTabRef,
      favoritePathsRef,
      hiddenPathsRef,
      setProjects,
      setScanEpoch,
      addToast
    ]
  )

  const loadProjectsForTab = useCallback(
    async (tab: TabType): Promise<Project[]> => {
      if (!window.electronAPI) return []
      try {
        logActivity('Projects tab load started', { tab })
        const raw = await window.electronAPI.scanProjects()
        clearGitCache()
        const deduped = dedupeProjectList(raw)
        allProjectsRef.current = deduped
        const filtered = filterForTab(
          tab,
          deduped,
          favoritePathsRef.current,
          hiddenPathsRef.current
        )
        setProjects(filtered)
        setScanEpoch((e) => e + 1)
        logActivity('Projects tab load completed', {
          tab,
          rawCount: raw.length,
          filteredCount: filtered.length
        })
        primeGitCache(deduped.map((p) => p.projectPath).filter(Boolean) as string[])
        return filtered
      } catch (err) {
        logActivity('Projects tab load failed', {
          tab,
          error: err instanceof Error ? err.message : String(err)
        })
        console.error('loadProjectsForTab failed:', err)
        addToast(
          `Failed to load projects (${tab}): ${err instanceof Error ? err.message : String(err)}`,
          'error'
        )
        return []
      }
    },
    [
      filterForTab,
      allProjectsRef,
      favoritePathsRef,
      hiddenPathsRef,
      setProjects,
      setScanEpoch,
      addToast
    ]
  )

  // Live size updates + removed projects
  useEffect(() => {
    if (!window.electronAPI) return

    // Batch size updates to avoid frequent re-renders when many files are scanned.
    const pending = new Map<string, string>()
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleFlush = () => {
      if (flushTimer) return
      flushTimer = setTimeout(() => {
        if (pending.size > 0) {
          const updates = new Map(pending)
          // Apply to allProjectsRef immediately
          for (const [path, size] of updates) {
            const idx = allProjectsRef.current.findIndex((p) => p.projectPath === path)
            if (idx >= 0) allProjectsRef.current[idx] = { ...allProjectsRef.current[idx], size }
          }
          // Batch setProjects once
          setProjects((prev) => {
            if (prev.length === 0) return prev
            const next = prev.map((p) => {
              const key = p.projectPath ?? ''
              const s = key ? updates.get(key) : undefined
              return s ? { ...p, size: s } : p
            })
            return next
          })
          // Persist updated sizes to cache
          try {
            const rawCache = localStorage.getItem('projectSizeCache')
            const cache = rawCache ? (JSON.parse(rawCache) as Record<string, string>) : {}
            for (const [path, size] of updates) {
              if (path) cache[path] = size
            }
            localStorage.setItem('projectSizeCache', JSON.stringify(cache))
          } catch {
            /* ignore */
          }
          pending.clear()
        }
        if (flushTimer) {
          clearTimeout(flushTimer)
          flushTimer = null
        }
      }, 200)
    }

    const unsubSize = window.electronAPI.onSizeCalculated((data) => {
      if (data.type !== 'project') return
      pending.set(data.path, data.size)
      scheduleFlush()
    })

    const unsubRemoved = window.electronAPI.onProjectRemoved((data) => {
      allProjectsRef.current = allProjectsRef.current.filter(
        (p) => p.projectPath !== data.projectPath
      )
      setProjects((prev) => prev.filter((p) => p.projectPath !== data.projectPath))
    })

    return () => {
      unsubSize()
      unsubRemoved()
      if (flushTimer) clearTimeout(flushTimer)
      pending.clear()
    }
  }, [allProjectsRef, setProjects])

  const refresh = useCallback(async (): Promise<void> => {
    await loadProjects('scan')
  }, [loadProjects])

  return { loading, backgroundScanning, loadProjects, loadProjectsForTab, refresh }
}
