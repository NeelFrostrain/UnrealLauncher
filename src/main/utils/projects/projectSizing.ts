// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import { app } from 'electron'
import { loadProjects, saveProjects } from '../../store'
import { formatBytes, getFullFolderSize } from '../system/folderOps'
import { getMainWindow } from '../../window'

const SIZE_EVENT_BATCH_MS = 120

type SizeCacheEntry = {
  mtimeMs: number
  size: string
}

type SizeCache = Record<string, SizeCacheEntry>

function getSizeCachePath(): string {
  return path.join(app.getPath('userData'), 'save', 'project-size-cache.json')
}

function loadSizeCache(): SizeCache {
  try {
    const cachePath = getSizeCachePath()
    if (!fs.existsSync(cachePath)) return {}
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as SizeCache
  } catch {
    return {}
  }
}

function saveSizeCache(cache: SizeCache): void {
  try {
    const cachePath = getSizeCachePath()
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8')
  } catch {
    /* cache is best-effort */
  }
}

async function getProjectMtime(projectPath: string): Promise<number> {
  try {
    const stat = await fsPromises.stat(projectPath)
    return stat.mtimeMs
  } catch {
    return 0
  }
}

async function getProjectSizeCached(projectPath: string, cache: SizeCache): Promise<string> {
  const normalized = path.normalize(projectPath).toLowerCase()
  const mtimeMs = await getProjectMtime(projectPath)
  if (mtimeMs > 0) {
    const cached = cache[normalized]
    if (cached && cached.mtimeMs === mtimeMs && cached.size) return cached.size
  }

  // Calculate size in the background worker thread
  const bytes = await getFullFolderSize(projectPath)
  const sizeStr = formatBytes(bytes)
  if (mtimeMs > 0) {
    cache[normalized] = { mtimeMs, size: sizeStr }
  }
  return sizeStr
}

/**
 * Calculates the size of a single project and updates storage asynchronously.
 * Returns an error if the folder no longer exists.
 */
export async function calculateProjectSize(projectPath: string): Promise<Record<string, unknown>> {
  try {
    try {
      await fsPromises.access(projectPath)
    } catch {
      return { success: false, error: 'Project folder not found' }
    }

    const cache = loadSizeCache()
    const sizeStr = await getProjectSizeCached(projectPath, cache)
    saveSizeCache(cache)

    const projects = loadProjects()
    const project = projects.find((p) => p.projectPath === projectPath)

    if (project) {
      saveProjects(
        projects.map((p) => (p.projectPath === projectPath ? { ...p, size: sizeStr } : p))
      )
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Track active bulk calculation to prevent overlapping duplicate runs
let isCalculatingAllSizes = false

/**
 * Calculates sizes for all projects asynchronously in the background worker thread.
 * Streams results back via 'size-calculated' push events with event loop yielding.
 * Never blocks the Electron main process event loop.
 */
export async function calculateAllProjectSizes(): Promise<void> {
  if (isCalculatingAllSizes) {
    return
  }

  isCalculatingAllSizes = true
  try {
    const win = getMainWindow()
    if (!win) return

    const projects = loadProjects()
    if (projects.length === 0) return

    // Filter projects asynchronously
    const checkResults = await Promise.all(
      projects.map(async (p) => {
        if (!p.projectPath) return { project: p, exists: false }
        try {
          await fsPromises.access(p.projectPath)
          return { project: p, exists: true }
        } catch {
          return { project: p, exists: false }
        }
      })
    )

    const existing = checkResults.filter((r) => r.exists).map((r) => r.project)
    const missing = checkResults.filter((r) => !r.exists).map((r) => r.project)

    if (missing.length > 0) {
      saveProjects(existing)
      if (win && !win.isDestroyed()) {
        for (const p of missing) {
          win.webContents.send('project-removed', { projectPath: p.projectPath })
        }
      }
    }

    if (existing.length === 0) return

    const sizeMap = new Map<string, string>()
    const cache = loadSizeCache()
    const pendingEvents: Array<{ type: 'project'; path: string; size: string }> = []
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    function flushSizeEvents(): void {
      flushTimer = null
      if (!win || win.isDestroyed() || pendingEvents.length === 0) return
      const events = pendingEvents.splice(0, pendingEvents.length)
      for (const event of events) {
        win.webContents.send('size-calculated', event)
      }
    }

    function queueSizeEvent(projectPath: string, size: string): void {
      pendingEvents.push({ type: 'project', path: projectPath, size })
      if (flushTimer) return
      flushTimer = setTimeout(flushSizeEvents, SIZE_EVENT_BATCH_MS)
    }

    // Process projects with event-loop yielding
    for (const project of existing) {
      if (!project.projectPath) continue
      try {
        const sizeStr = await getProjectSizeCached(project.projectPath, cache)
        sizeMap.set(project.projectPath, sizeStr)
        queueSizeEvent(project.projectPath, sizeStr)
      } catch {
        /* skip and continue */
      }
      // Yield to the event loop so the UI remains 100% fluid and responsive
      await new Promise<void>((resolve) => setImmediate(resolve))
    }

    if (flushTimer) {
      clearTimeout(flushTimer)
      flushSizeEvents()
    }
    saveSizeCache(cache)

    if (sizeMap.size > 0) {
      const all = loadProjects()
      saveProjects(
        all.map((p) => {
          const size = sizeMap.get(p.projectPath)
          return size ? { ...p, size } : p
        })
      )
    }
  } finally {
    isCalculatingAllSizes = false
  }
}
