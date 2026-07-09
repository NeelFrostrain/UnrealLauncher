// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { loadEngines, saveEngines } from '../store'
import { formatBytes, getFullFolderSize } from '../utils'

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

async function getEngineSizeCached(directoryPath: string): Promise<string> {
  const normalized = path.normalize(directoryPath).toLowerCase()
  const cache = loadSizeCache()
  const mtimeMs = fs.statSync(directoryPath).mtimeMs
  const cached = cache[normalized]
  if (cached && cached.mtimeMs === mtimeMs && cached.size) return cached.size

  const sizeStr = formatBytes(await getFullFolderSize(directoryPath))
  cache[normalized] = { mtimeMs, size: sizeStr }
  saveSizeCache(cache)
  return sizeStr
}

/**
 * Calculates the size of a single engine and updates storage
 */
export async function calculateEngineSize(directoryPath: string): Promise<Record<string, unknown>> {
  try {
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
