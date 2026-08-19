// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app } from 'electron'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { loadEngines, saveEngines } from '../../store'
import { formatBytes, getFullFolderSize } from '../system/folderOps'

type SizeCacheEntry = {
  mtimeMs: number
  size: string
}

type SizeCache = Record<string, SizeCacheEntry>

function getSizeCachePath(): string {
  return path.join(app.getPath('userData'), 'save', 'engine-size-cache.json')
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

async function getEngineMtime(dirPath: string): Promise<number> {
  try {
    const stat = await fsPromises.stat(dirPath)
    return stat.mtimeMs
  } catch {
    return 0
  }
}

async function getEngineSizeCached(directoryPath: string): Promise<string> {
  const normalized = path.normalize(directoryPath).toLowerCase()
  const cache = loadSizeCache()
  const mtimeMs = await getEngineMtime(directoryPath)
  if (mtimeMs > 0) {
    const cached = cache[normalized]
    if (cached && cached.mtimeMs === mtimeMs && cached.size) return cached.size
  }

  // Calculate size in the background worker thread without blocking main process
  const bytes = await getFullFolderSize(directoryPath)
  const sizeStr = formatBytes(bytes)
  if (mtimeMs > 0) {
    cache[normalized] = { mtimeMs, size: sizeStr }
    saveSizeCache(cache)
  }
  return sizeStr
}

/**
 * Calculates engine installation folder size asynchronously in background worker thread.
 * Never blocks the Electron main process event loop.
 */
export async function calculateEngineSize(directoryPath: string): Promise<Record<string, unknown>> {
  try {
    try {
      await fsPromises.access(directoryPath)
    } catch {
      return { success: false, error: 'Engine directory not found' }
    }

    const sizeStr = await getEngineSizeCached(directoryPath)

    const engines = loadEngines()
    const engine = engines.find((e) => e.directoryPath === directoryPath)

    if (engine) {
      engine.folderSize = sizeStr
      saveEngines(engines)
    }

    return { success: true, size: sizeStr }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
