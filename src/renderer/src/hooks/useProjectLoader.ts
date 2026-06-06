// Copyright (c) 2026 NeelFrostrain. All rights reserved.
/**
 * Handles loading, scanning, and live-update subscriptions for the project list.
 * Extracted from useProjectsPageState to keep each hook under 150 lines.
 */
import { useState, useCallback, useRef, useEffect, MutableRefObject } from 'react'
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
  allProjectsRef:  MutableRefObject<Project[]>
  currentTabRef:   MutableRefObject<TabType>
  favoritePathsRef: MutableRefObject<string[]>
  hiddenPathsRef:  MutableRefObject<string[]>
  filterForTab:    (tab: TabType, src: Project[], fav: string[], hid: string[]) => Project[]
  setProjects:     (p: Project[]) => void
  setScanEpoch:    (fn: (e: number) => number) => void
}

export function useProjectLoader({
  allProjectsRef, currentTabRef, favoritePathsRef, hiddenPathsRef,
  filterForTab, setProjects, setScanEpoch
}: Options) {
  const { addToast } = useToast()
  const [loading,          setLoading]          = useState(false)
  const [backgroundScanning, setBackgroundScanning] = useState(false)

  const loadProjects = useCallback(async (source: 'saved' | 'scan'): Promise<Project[]> => {
    if (!window.electronAPI) return []
    if (source === 'saved') setLoading(true); else setBackgroundScanning(true)
    try {
      logActivity('Projects load started', { source })
      const raw = source === 'saved'
        ? await window.electronAPI.loadSavedProjects()
        : await window.electronAPI.scanProjects()
      clearGitCache()
      const deduped = dedupeProjectList(raw)
      allProjectsRef.current = deduped
      setProjects(filterForTab(currentTabRef.current, deduped, favoritePathsRef.current, hiddenPathsRef.current))
      setScanEpoch((e) => e + 1)
      logActivity('Projects load completed', { source, rawCount: raw.length, dedupedCount: deduped.length })
      primeGitCache(deduped.map((p) => p.projectPath).filter(Boolean) as string[])
      return deduped
    } catch (err) {
      logActivity('Projects load failed', { source, error: err instanceof Error ? err.message : String(err) })
      console.error(`loadProjects(${source}) failed:`, err)
      addToast(`Failed to load projects (${source}): ${err instanceof Error ? err.message : String(err)}`, 'error')
      return []
    } finally {
      if (source === 'saved') setLoading(false); else setBackgroundScanning(false)
    }
  }, [filterForTab, allProjectsRef, currentTabRef, favoritePathsRef, hiddenPathsRef, setProjects, setScanEpoch, addToast])

  const loadProjectsForTab = useCallback(async (tab: TabType): Promise<Project[]> => {
    if (!window.electronAPI) return []
    try {
      logActivity('Projects tab load started', { tab })
      const raw = await window.electronAPI.scanProjects()
      clearGitCache()
      const deduped = dedupeProjectList(raw)
      allProjectsRef.current = deduped
      const filtered = filterForTab(tab, deduped, favoritePathsRef.current, hiddenPathsRef.current)
      setProjects(filtered)
      setScanEpoch((e) => e + 1)
      logActivity('Projects tab load completed', { tab, rawCount: raw.length, filteredCount: filtered.length })
      primeGitCache(deduped.map((p) => p.projectPath).filter(Boolean) as string[])
      return filtered
    } catch (err) {
      logActivity('Projects tab load failed', { tab, error: err instanceof Error ? err.message : String(err) })
      console.error('loadProjectsForTab failed:', err)
      addToast(`Failed to load projects (${tab}): ${err instanceof Error ? err.message : String(err)}`, 'error')
      return []
    }
  }, [filterForTab, allProjectsRef, favoritePathsRef, hiddenPathsRef, setProjects, setScanEpoch, addToast])

  // Live size updates + removed projects
  useEffect(() => {
    if (!window.electronAPI) return
    const unsubSize = window.electronAPI.onSizeCalculated((data) => {
      if (data.type !== 'project') return
      const idx = allProjectsRef.current.findIndex((p) => p.projectPath === data.path)
      if (idx >= 0) allProjectsRef.current[idx] = { ...allProjectsRef.current[idx], size: data.size }
      setProjects(prev => {
        const i = prev.findIndex((p) => p.projectPath === data.path)
        if (i < 0) return prev
        const updated = [...prev]; updated[i] = { ...prev[i], size: data.size }; return updated
      })
    })
    const unsubRemoved = window.electronAPI.onProjectRemoved((data) => {
      allProjectsRef.current = allProjectsRef.current.filter((p) => p.projectPath !== data.projectPath)
      setProjects((prev) => prev.filter((p) => p.projectPath !== data.projectPath))
    })
    return () => { unsubSize(); unsubRemoved() }
  }, [allProjectsRef, setProjects])

  return { loading, backgroundScanning, loadProjects, loadProjectsForTab }
}
