// Copyright (c) 2026 NeelFrostrain. All rights reserved.
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { getNative } from '../utils/native'
import { logger } from '../logger'

interface EnginePlugin {
  name: string
  path: string
  description: string
  version: string
  category: string
  isBeta: boolean
  isExperimental: boolean
  icon: string | null
  createdBy: string
}

/**
 * Scans engine plugins using native module or JS fallback (async, non-blocking)
 */
export async function scanEnginePlugins(engineDir: string): Promise<EnginePlugin[]> {
  // Try native Rust module first (fast, parallel I/O)
  const native = getNative()
  if (native?.scanEnginePlugins) {
    try {
      const result = native.scanEnginePlugins(engineDir)
      return result.map((p) => ({
        name: p.name,
        path: p.path,
        description: p.description,
        version: p.version,
        category: p.category,
        isBeta: p.isBeta,
        isExperimental: p.isExperimental,
        icon: p.icon ?? null,
        createdBy: p.createdBy
      }))
    } catch (error) {
      logger.warn('engine-plugins', 'Native plugin scan failed, falling back to JS', { error })
      /* fall through to JS implementation */
    }
  }

  // JS fallback — same logic as the Rust implementation (async to avoid blocking)
  return scanEnginePluginsJS(engineDir)
}

/**
 * JavaScript fallback for scanning engine plugins (async, non-blocking)
 * Uses async file operations to prevent main thread blocking
 */
async function scanEnginePluginsJS(engineDir: string): Promise<EnginePlugin[]> {
  const pluginsRoot = path.join(engineDir, 'Engine', 'Plugins')

  try {
    await fsPromises.access(pluginsRoot)
  } catch {
    return []
  }

  const results: EnginePlugin[] = []
  const SKIP_FOLDERS = new Set(['FabLibrary', 'Manifests', '.cache', 'temp', 'Temp'])

  async function scanDir(dir: string, categoryHint: string, depth: number): Promise<void> {
    if (depth > 3) return

    let entries: fs.Dirent[]
    try {
      entries = await fsPromises.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    const upluginFile = entries.find((e) => e.isFile() && e.name.endsWith('.uplugin'))
    if (upluginFile) {
      const upluginPath = path.join(dir, upluginFile.name)
      let name = path.basename(dir)
      let description = ''
      let version = ''
      let category = categoryHint
      let isBeta = false
      let isExperimental = false
      let icon: string | null = null
      let createdBy = ''

      try {
        const content = await fsPromises.readFile(upluginPath, 'utf8')
        const meta = JSON.parse(content)
        name = meta.FriendlyName || meta.Name || name
        description = meta.Description || ''
        version = meta.VersionName || String(meta.Version || '')

        if (
          meta.Category &&
          typeof meta.Category === 'string' &&
          meta.Category.trim() &&
          category !== 'Marketplace'
        ) {
          category = meta.Category.trim()
        }

        isBeta = !!meta.IsBetaVersion
        isExperimental = !!meta.IsExperimentalVersion
        createdBy = meta.CreatedBy || ''
      } catch {
        /* keep defaults */
      }

      const iconPath = path.join(dir, 'Resources', 'Icon128.png')
      try {
        await fsPromises.access(iconPath)
        icon = iconPath
      } catch {
        /* icon doesn't exist */
      }

      results.push({
        name,
        path: dir,
        description,
        version,
        category,
        isBeta,
        isExperimental,
        icon,
        createdBy
      })
      return
    }

    // Process subdirectories — yield once per top-level category to keep event loop alive
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (SKIP_FOLDERS.has(entry.name)) continue
      const childCategory = depth === 0 ? entry.name : categoryHint
      if (depth === 0) await new Promise((resolve) => setImmediate(resolve))
      await scanDir(path.join(dir, entry.name), childCategory, depth + 1)
    }
  }

  await scanDir(pluginsRoot, 'Other', 0)
  results.sort((a, b) => {
    const cat = a.category.localeCompare(b.category)
    return cat !== 0 ? cat : a.name.localeCompare(b.name)
  })

  return results
}
