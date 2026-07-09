// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import path from 'path'
import { app } from 'electron'
import { loadProjects, saveProjects } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'
import { getMainWindow } from '../window'

const CONCURRENCY = 3
const SIZE_EVENT_BATCH_MS = 150

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
    const fs = require('fs') as typeof import('fs')
    const cachePath = getSizeCachePath()
    if (!fs.existsSync(cachePath)) return {}
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as SizeCache
  } catch {
    return {}
  }
}

function saveSizeCache(cache: SizeCache): void {
  try {
    const fs = require('fs') as typeof import('fs')
    const cachePath = getSizeCachePath()
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8')
  } catch {
    /* cache is best-effort */
  }
}

async function getProjectSizeCached(projectPath: string, cache: SizeCache): Promise<string> {
  const fs = await import('fs')
  const normalized = path.normalize(projectPath).toLowerCase()
  const mtimeMs = fs.statSync(projectPath).mtimeMs
  const cached = cache[normalized]
  if (cached && cached.mtimeMs === mtimeMs && cached.size) return cached.size

  const sizeStr = formatBytes(await getFullFolderSize(projectPath))
  cache[normalized] = { mtimeMs, size: sizeStr }
  return sizeStr
}

/**
 * Calculates the size of a single project and updates storage.
 * Returns an error if the folder no longer exists.
 */
export async function calculateProjectSize(projectPath: string): Promise<Record<string, unknown>> {
  try {
    // Guard: don't report 0 B for a folder that no longer exists
    const fs = await import('fs')
    if (!fs.existsSync(projectPath)) {
      return { success: false, error: 'Project folder not found' }
    }
    const cache = loadSizeCache()
    const sizeStr = await getProjectSizeCached(projectPath, cache)
    saveSizeCache(cache)
    const projects = loadProjects()
    const project = projects.find((p) => p.projectPath === projectPath)

    if (project) {
      // Use immutable update to avoid mutating the loaded projects array directly
      saveProjects(
        projects.map((p) => (p.projectPath === projectPath ? { ...p, size: sizeStr } : p))
      )
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Calculates sizes for all projects concurrently.
 * Streams results back via 'size-calculated' push events.
 * Batches all store writes into a single save at the end to avoid
 * N synchronous readFileSync + writeFileSync calls during the loop.
 * Projects whose folders no longer exist are removed from the store.
 */
export async function calculateAllProjectSizes(): Promise<void> {
  const win = getMainWindow()
  if (!win) return

  const projects = loadProjects()
  if (projects.length === 0) return

  // Separate existing from missing up-front
  const fs = await import('fs')
  const existing = projects.filter((p) => p.projectPath && fs.existsSync(p.projectPath))
  const missing = projects.filter((p) => !p.projectPath || !fs.existsSync(p.projectPath))

  // Remove missing projects from the store immediately
  if (missing.length > 0) {
    saveProjects(existing)
    // Notify renderer to remove the cards
    if (win && !win.isDestroyed()) {
      for (const p of missing) {
        win.webContents.send('project-removed', { projectPath: p.projectPath })
      }
    }
  }

  if (existing.length === 0) return

  const queue = existing.slice()
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

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const project = queue.shift()
      if (!project) break
      try {
        const sizeStr = await getProjectSizeCached(project.projectPath, cache)
        sizeMap.set(project.projectPath, sizeStr)

        queueSizeEvent(project.projectPath, sizeStr)
      } catch {
        /* skip errors and continue */
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushSizeEvents()
  }
  saveSizeCache(cache)

  // Single batched write after all sizes are calculated
  if (sizeMap.size > 0) {
    const all = loadProjects()
    saveProjects(
      all.map((p) => {
        const size = sizeMap.get(p.projectPath)
        return size ? { ...p, size } : p
      })
    )
  }
}
